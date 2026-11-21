use std::io::Write;
use tauri_plugin_sql::{Migration, MigrationKind};

/// 把启动过程写入 %LOCALAPPDATA%\com.mashang.workshop\startup.log。
/// 发布版使用 windows_subsystem = "windows"，没有控制台，日志文件是唯一的诊断线索。
fn startup_log(message: &str) {
    let base = std::env::var_os("LOCALAPPDATA")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("com.mashang.workshop");
    if std::fs::create_dir_all(&base).is_err() {
        return;
    }
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(base.join("startup.log"))
    {
        let _ = writeln!(file, "[{:?}] {}", std::time::SystemTime::now(), message);
    }
}

#[cfg(windows)]
fn show_error_dialog(message: &str) {
    use std::os::windows::ffi::OsStrExt;

    #[link(name = "user32")]
    extern "system" {
        fn MessageBoxW(
            hwnd: *mut core::ffi::c_void,
            text: *const u16,
            caption: *const u16,
            utype: u32,
        ) -> i32;
    }

    let text: Vec<u16> = std::ffi::OsStr::new(message)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let caption: Vec<u16> = std::ffi::OsStr::new("码上工坊启动失败")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    unsafe {
        MessageBoxW(std::ptr::null_mut(), text.as_ptr(), caption.as_ptr(), 0x0000_0010);
    }
}

#[cfg(not(windows))]
fn show_error_dialog(_message: &str) {}

/// 解析 "158.0.4370.33" 这类版本目录名，用于比较版本高低。
fn version_key(name: &str) -> Vec<u32> {
    let mut parts: Vec<u32> = name
        .split('.')
        .filter_map(|part| part.parse::<u32>().ok())
        .collect();
    // 至少要求形如 x.y，避免把 "Optimized" 之类的目录当成版本。
    if parts.len() < 2 {
        parts.clear();
    }
    parts
}

/// 在 root 下找出带指定可执行文件的最新版本目录。
fn newest_runtime_dir(
    root: &std::path::Path,
    marker: &str,
) -> Option<(Vec<u32>, std::path::PathBuf)> {
    let entries = std::fs::read_dir(root).ok()?;
    let mut best: Option<(Vec<u32>, std::path::PathBuf)> = None;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() || !path.join(marker).is_file() {
            continue;
        }
        let key = version_key(&entry.file_name().to_string_lossy());
        if key.is_empty() {
            continue;
        }
        if best.as_ref().map_or(true, |(current, _)| key > *current) {
            best = Some((key, path));
        }
    }
    best
}

/// WebView2 157.x 在 Windows 11 25H2（Build 26200）上会在 msedge.dll / msedge_elf.dll
/// 触发 0x80000003（STATUS_BREAKPOINT）：窗口能创建，但渲染进程启动即崩溃。
/// Edge 浏览器不受影响，说明是 WebView2 运行时与系统的兼容问题。
///
/// Windows 自带的 inbox WebView2（%SystemRoot%\System32\Microsoft-Edge-WebView）
/// 由系统组件维护，在这类机器上可以正常渲染，因此：
/// - Evergreen 运行时缺失，或主版本为已知有问题的 157 时，自动改用 inbox 运行时；
/// - 其他版本保持默认，不干预用户已安装的 WebView2。
///
/// 可用 CODE_WORKSHOP_USE_INBOX_WEBVIEW=1 强制使用 inbox 运行时，
/// 或 CODE_WORKSHOP_DISABLE_WEBVIEW_FALLBACK=1 完全关闭该回退。
fn prefer_working_webview_runtime() {
    if std::env::var_os("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER").is_some() {
        return;
    }

    let system_root = std::env::var_os("SystemRoot")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| std::path::PathBuf::from(r"C:\Windows"));
    let inbox_dir = system_root.join(r"System32\Microsoft-Edge-WebView");
    let inbox_ready = inbox_dir.join("msedgewebview2.exe").is_file();

    let forced = std::env::var_os("CODE_WORKSHOP_USE_INBOX_WEBVIEW").is_some();
    if !forced && std::env::var_os("CODE_WORKSHOP_DISABLE_WEBVIEW_FALLBACK").is_some() {
        return;
    }

    let program_files = std::env::var_os("ProgramFiles(x86)")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| std::path::PathBuf::from(r"C:\Program Files (x86)"));
    let mut installed_version: Option<Vec<u32>> = None;
    let mut roots = vec![program_files.join(r"Microsoft\EdgeWebView\Application")];
    if let Some(program_files_64) = std::env::var_os("ProgramFiles") {
        roots.push(std::path::PathBuf::from(program_files_64).join(r"Microsoft\EdgeWebView\Application"));
    }
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        roots.push(std::path::PathBuf::from(local).join(r"Microsoft\EdgeWebView\Application"));
    }
    for root in roots {
        if let Some((version, _)) = newest_runtime_dir(&root, "msedgewebview2.exe") {
            if installed_version
                .as_ref()
                .map_or(true, |current| version > *current)
            {
                installed_version = Some(version);
            }
        }
    }

    let known_broken = installed_version
        .as_ref()
        .map_or(true, |version| version.first() == Some(&157));
    if !(forced || known_broken) || !inbox_ready {
        return;
    }

    std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", &inbox_dir);
    startup_log(&format!(
        "WebView2 fallback: installed={:?}, using inbox runtime at {}",
        installed_version
            .as_ref()
            .map(|parts| parts.iter().map(u32::to_string).collect::<Vec<_>>().join(".")),
        inbox_dir.display()
    ));
}


const SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS workshop_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workshop_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workshop_events (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  level TEXT NOT NULL,
  module TEXT
);

CREATE TABLE IF NOT EXISTS workshop_sessions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  label TEXT NOT NULL,
  date TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workshop_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL,
  score INTEGER,
  updated_at TEXT NOT NULL
);
"#;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    startup_log("application starting");
    // 必须在创建 WebView2 之前选择运行时。
    prefer_working_webview_runtime();

    let migrations = vec![Migration {
        version: 1,
        description: "create code workshop sqlite schema",
        sql: SCHEMA,
        kind: MigrationKind::Up,
    }];

    let result = tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:code-workshop.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!());

    if let Err(error) = result {
        let message = format!("error while running Code Workshop: {error}");
        startup_log(&message);
        show_error_dialog(&message);
        std::process::exit(1);
    }

    startup_log("application exited");
}
