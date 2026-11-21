# 码上工坊 · 剩余工作与问题清单

> 更新时间：2026-11-21 13:20（Asia/Shanghai）  
> 项目目录：仓库根目录  
> 当前阶段：**Tauri 2 外壳 + SQLite + Pyodide 已实现；WebView2 157 崩溃已修复（自动回退 inbox 运行时）**

---

## 0. 一句话结论

Web 端、桌面端和 Pyodide 真实判题都已跑通。桌面端原先把 Windows 11 25H2 + WebView2 157 的 `0x80000003` 崩溃误判为应用问题；本轮定位为运行时兼容问题，并在 Rust 启动逻辑中自动回退到系统 inbox WebView2，桌面窗口已能完整渲染工作台。剩余工作只有：真实双击启动下验证 SQLite 落库、补安装包、以及 P2 功能差距。

---

## 1. 当前完成度

| 模块 | 状态 | 说明 |
|---|---|---|
| 工作台首页 | 已完成 | 4 KPI、14 天折线、六维雷达、学习岛、项目脉搏、模块投入、8 周热力图、事件时间线 |
| 排序实验室 | 已完成（本轮补齐 500 元素） | 8 种排序；10–500 元素；播放/暂停/单步/倍速/换数据、双栏对比、伪代码高亮；大数组帧抽样 + 柱状图聚合 + 8 算法性能基准 |
| Python 语法闯关 | 已完成 | 10 章 × 5 关 × 5 任务，共 250 个任务；Pyodide 真实执行判题 |
| 项目工坊 | 已完成 | 8 个模板、两阶段门禁、看板、快照回滚、四维评分、归档作品集 |
| AI 训练场 | 已完成 | 24 个提示词、搜索/收藏、OpenAI 兼容配置、演示模式、六步工作流、三角色对比 |
| 监控台 | 已完成（模拟） | 8 模块启停、指标、异常模拟/恢复、日志筛选；指标为本地模拟 |
| 成长档案 | 已完成 | 雷达、时长、热力图、目标、作品集、周报 Markdown/打印 PDF |
| 设置 | 已完成 | 主题、减弱动效、昵称、档案导入导出、AI 配置、存储后端显示 |
| Tauri 2 外壳 | 已实现、可构建、**桌面渲染已修复** | 自动回退 inbox WebView2；exe 已同步 `desktop/` |
| SQLite 持久化 | 已实现、**桌面端落库待真实双击验证** | 5 张表 + migration + 适配器 + 权限；另加退出 flush、尾部调度、localStorage 迁移 |
| 启动健壮性 | 已完成 | 5s hydration 超时兜底、全局错误面板、Tauri 启动日志 + 系统错误对话框 |
| Pyodide 判题 | 已完成并验证 | Web 端真实执行通过，冷启动约 15s，热执行 4ms |

---

## 2. 本轮新增的技术实现

### 2.1 持久化可靠性（`src/lib/persistence.ts`）

- **退出前 flush**：新增 `flushStorage()`；在 `pagehide` / `beforeunload` / `visibilitychange=hidden` / Tauri `onCloseRequested` 时立即写镜像表；
- **镜像尾部调度**：节流窗口内最后一次写入会补写，不再被 `return` 直接丢弃；
- **一次性迁移**：桌面端首次启动且 `workshop_state` 为空时，把 localStorage 旧档案写入 SQLite，并同步镜像表，保留 localStorage 备份；
- **数据库加载失败可重试**：`Database.load` 失败后清空缓存 Promise，下次调用会重试。

### 2.2 启动健壮性

- `src/App.tsx`：hydration 5 秒超时后显示「先进入工作台」，避免启动屏卡死；同时注册退出 flush 钩子；
- `src/main.tsx`：全局 `error` / `unhandledrejection` + React ErrorBoundary，失败时渲染可见错误面板并提示日志路径；
- `src-tauri/src/lib.rs`：启动写 `%LOCALAPPDATA%\com.mashang.workshop\startup.log`；`run()` 返回错误时写日志并通过 `MessageBoxW` 弹出错误对话框；
- `src-tauri/tauri.conf.json`：删除实验性 `additionalBrowserArgs`。

### 2.3 排序实验室 500 元素

- `src/lib/sorting.ts`：`generateSortSteps` 增加 `maxFrames` 选项，>120 元素时按估算步数抽样，仍然完整统计 comparisons/swaps，最后一帧始终保留；
- `src/pages/SortPage.tsx`：规模滑杆 10–500；柱状图最多渲染 160 根（按桶聚合）；新增「性能基准」面板，逐个跑 8 个算法并记录耗时/比较/交换/帧数；
- `test-sorting.mjs`：新增 200 / 500 元素对拍与帧数上限断言。

### 2.4 Tauri 2（沿用上一轮）

- `Cargo.toml`：`tauri = 2`、`tauri-plugin-sql = 2`（sqlite feature）
- `tauri.conf.json`：窗口 1440×900、最小 1280×720、`frontendDist: ../dist`
- `src/lib.rs`：注册 SQL 插件、执行 migration
- `capabilities/default.json`：`core:default`、`core:window:allow-close`、`core:window:allow-destroy`、`sql:default`、`sql:allow-execute`

构建产物（本轮重建）：

```text
src-tauri/target/release/code-workshop.exe   32,801,162 bytes  2026-11-21 12:51
src-tauri/target/release/WebView2Loader.dll     160,880 bytes
desktop/码上工坊.exe                          32,801,162 bytes  已同步
```

### 2.5 SQLite 表结构

数据库：`sqlite:code-workshop.db`，由 `tauri-plugin-sql` 管理。

```text
workshop_state     id / payload / updated_at      整份 Zustand 档案 JSON
workshop_meta      key / value                    保存时间 / schema 版本 / migrated_from
workshop_events    id / at / type / title ...     事件镜像（SQL 可查）
workshop_sessions  id / module / label ...        学习会话镜像
workshop_projects  id / title / level / status ... 项目 / 阶段 / 评分镜像
```

### 2.6 Pyodide（沿用上一轮）

- 自托管资源：`public/pyodide/`（约 13 MB）
- Worker：`src/workers/python.worker.ts`
- Runner：`src/lib/pythonRunner.ts`，30 秒超时后 terminate worker
- 判题：结构检查 + 真实执行 + `stdout` 与 `expected` 比较

---

## 3. 当前问题（按严重程度）

### P0-1 WebView2 157 渲染进程崩溃 —— 已修复

**现象**

- exe 启动后能创建标题为「码上工坊 · 开发者成长工作台」的窗口；
- 约 7–12 秒后窗口空白/退出；
- 事件日志稳定复现：

```text
Faulting application: msedgewebview2.exe 157.0.4341.60
Faulting module: msedge_elf.dll
Exception code: 0x80000003
```

**定位过程（本轮）**

| 尝试 | 结果 |
|---|---|
| 删除 `additionalBrowserArgs` | 仍崩溃，排除参数问题 |
| 清理 WebView2 用户数据目录 / 结束残留进程 | 仍崩溃 |
| 用 Edge 158 的 EdgeCore 作为固定运行时 | 仍崩溃，故障模块变为 `msedge.dll` |
| 安装最新 Evergreen WebView2（294 MB 离线包） | 安装需要管理员权限，静默安装 exit -1，未能升级 |
| 系统 inbox WebView2 152（`C:\Windows\System32\Microsoft-Edge-WebView`） | **正常渲染，持续运行无崩溃** |

**根因判断**

- 崩溃只在 `msedgewebview2.exe`，Edge 浏览器本身正常；
- Windows 11 25H2（Build 26200）+ Evergreen WebView2 157 的运行时兼容问题；
- 同类 `0x80000003` 在 Windows 11 新版本的 inbox WebView2 上已有公开报告；
- 应用代码无法修复运行时本身，但可以选择一个能工作的运行时。

**修复实现**（`src-tauri/src/lib.rs` 的 `prefer_working_webview_runtime()`）

- 启动时、创建 WebView2 前检查 Evergreen 运行时版本；
- 运行时缺失，或主版本为 **157.x** 时，自动设置 `WEBVIEW2_BROWSER_EXECUTABLE_FOLDER` 指向 inbox WebView2；
- 其他版本不干预；
- `CODE_WORKSHOP_USE_INBOX_WEBVIEW=1` 可强制使用 inbox；`CODE_WORKSHOP_DISABLE_WEBVIEW_FALLBACK=1` 可关闭回退。

**验证（13:11 构建，无环境变量）**

- 子进程路径：`C:\Windows\System32\Microsoft-Edge-WebView\msedgewebview2.exe`；
- 窗口标题正确，`PrintWindow` 截图完整渲染工作台（侧边栏、KPI、折线图）；
- 持续运行 24 秒无崩溃、无新增 Application Error；
- exe 已同步 `desktop/码上工坊.exe`（32,832,559 bytes，13:11）。

**残留限制**

- inbox 运行时是 152，比 Evergreen 157 旧；这是兼容性回退，后续 WebView2 修复后会自动回到 Evergreen；
- 应用启动时无法预判运行时是否稳定，因此用「版本 157 即回退」的保守规则；如遇其他坏版本，可用环境变量强制 inbox。

### P0-2 SQLite 桌面端落库待真实双击验证

桌面窗口已能渲染，应用会执行 SQLite 读取/迁移；但自动化工具启动的子进程对 `%LOCALAPPDATA%`、`%APPDATA%` 的写入被沙箱拒绝（最小 Rust 探针复现 `os error 5`），因此本环境无法验证落库：

- `Database.load` 是否成功、migration 是否创建 5 张表；
- `workshop_state` 是否写入；
- 刷新/重启后是否从 SQLite 恢复；
- 镜像表是否同步、退出 flush 是否生效；
- 导入/导出/重置在 SQLite 下是否正确。

**目前只验证了**：5 张表 SQL 在 sqlite3 中执行成功；适配器 localStorage 回退路径有单元测试；桌面窗口渲染正常。

**下一步**：真实双击 `desktop/码上工坊.exe`，检查 `%APPDATA%\com.mashang.workshop\code-workshop.db` 与 `%LOCALAPPDATA%\com.mashang.workshop\startup.log`。

### P0-3 桌面发布物与源码不同步 —— 已解决

- `desktop/码上工坊.exe` 已更新为 13:11 构建（32,832,559 bytes）；
- `desktop/WebView2Loader.dll` 已同步；
- `README.md` 中的 exe 大小、构建时间、行为已对齐。

### P1-1 Tauri 构建链路非官方

- 本机无管理员权限，无法安装 Visual Studio C++ Build Tools；
- 使用 Rust GNU + WinLibs MinGW 构建；
- 本轮未加 specs，链接时出现 `multiple non-default manifests` 警告（exe 仍可运行）；
- 可用 `-C link-arg=-specs=<项目目录>/.toolchain/no-default-manifest.specs` 消除警告，但会触发全量重编。

### P1-2 MSVC 替代构建未成功

`cargo-xwin` 在 MSVC CRT 下载阶段反复失败，未产出 MSVC 版 exe。

### P1-3 没有安装包

- `bundle.active: false`；
- 只有 `--no-bundle` 的便携 exe；
- 没有 NSIS/MSI 安装包、开始菜单项、卸载器。

### P1-4 Web 预览服务当前已停止

```powershell
cd <项目目录>
npm run serve
# 或
node serve.mjs
```

如果 `dist` 不存在，先 `npm run build`。注意：本机 esbuild 在受限沙箱里会因临时目录权限失败，需要把 `TEMP` / `TMP` 指到项目内可写目录（例如 `<项目目录>/.tmp`）。

### P2 仍存在的功能差距

- **P2-5 Pyodide 边界**：文件读写题、随机数题仍按规则判定；无 stdin、无内存/CPU 配额；无限循环后需要重新冷启动；
- **P2-6 监控台模拟数据**：CPU / 内存 / FPS / 运行时长都是本地生成，未接真实进程/端口/日志；
- **P2-8 编辑器**：CodeMirror 6，不是文档里的 Monaco；
- **P2-9 AI 真实接口**：没有真实 API Key，未验证错误处理、超时与流式输出；
- **P2-10 测试覆盖**：已有 typecheck、排序对拍、课程结构、存储回退、Web E2E、Pyodide、SQLite schema；仍缺 SQLite 适配器集成测试、Tauri 启动/持久化自动化测试、项目门禁/快照回滚回归、CI；
- **P2-1 SQLite 规范化**：主数据仍是整份 JSON 快照 + 派生镜像，不是细粒度 repository。

---

## 4. 剩余工作清单（按优先级）

### P0：让桌面端真正跑起来并验证 SQLite

- [x] 定位 WebView2 崩溃根因（157 运行时与 Windows 11 25H2 不兼容）
- [x] 实现自动回退 inbox WebView2，并验证窗口完整渲染
- [x] exe 启动后确认窗口能渲染首页，不空白（截图验证）
- [ ] 真实双击启动后确认应用配置目录出现 `code-workshop.db`
- [ ] 查询 5 张表，确认 migration 执行
- [ ] 改一个关卡/项目 → 关闭 → 重开，确认 SQLite 恢复
- [ ] 确认设置页显示 `SQLite · tauri-plugin-sql`
- [ ] 确认刷新后 actions 仍存在（不能出现按钮全部失效）
- [x] 把最终 exe 重新复制到 `desktop/`，并更新 README 的时间/大小/行为

### P1：发布质量

- [x] 移除实验性 `additionalBrowserArgs`
- [ ] 用 MSVC + VS Build Tools 重新构建，产出正式 exe
- [ ] 配置 NSIS 安装包、图标、版本号、卸载器
- [x] 增加 Tauri 日志/错误提示，避免启动失败时静默退出
- [x] 增加 SQLite 退出前 flush
- [x] 增加 localStorage → SQLite 一次性迁移
- [x] 更新 README 的「已知问题」与「构建步骤」

### P2：功能补齐

- [ ] Pyodide 虚拟文件系统，文件题真实执行
- [ ] Pyodide 内存/CPU 限制、stdin
- [ ] 监控台接真实进程/日志
- [x] 排序支持 500 元素 + 性能基准
- [ ] Monaco 替换 CodeMirror（可选）
- [ ] AI 真实 Key E2E、流式输出、错误重试
- [ ] SQLite repository 规范化（不再只存整份 JSON）
- [ ] 单元测试 + CI（本轮已补排序大数组与存储回退测试）

---

## 5. 关键文件索引

| 文件 | 作用 |
|---|---|
| `src-tauri/tauri.conf.json` | 窗口、构建、bundle 配置；已移除实验参数 |
| `src-tauri/src/lib.rs` | Tauri 入口、WebView2 运行时选择、SQLite migration、启动日志与错误对话框 |
| `src-tauri/capabilities/default.json` | ACL：`core:default`、window close/destroy、`sql:default`、`sql:allow-execute` |
| `src-tauri/target/release/code-workshop.exe` | 当前最新构建（13:11，32.8 MB） |
| `desktop/码上工坊.exe` | 已同步至最新构建 |
| `desktop/WebView2Loader.dll` | 便携版依赖 |
| `src/lib/persistence.ts` | SQLite/localStorage 适配器、迁移、flush、镜像同步 |
| `src/App.tsx` | hydration 超时兜底、退出 flush |
| `src/main.tsx` | 全局错误面板 + ErrorBoundary |
| `src/lib/sorting.ts` | 8 种排序、帧采样、统计 |
| `src/pages/SortPage.tsx` | 排序可视化、500 元素、性能基准 |
| `src/lib/pythonRunner.ts` | Pyodide Worker 调用、30s 超时 |
| `src/workers/python.worker.ts` | Pyodide 加载与 stdout 捕获 |
| `public/pyodide/` | 自托管 Pyodide 资源（约 13 MB） |
| `test-storage.mjs` | localStorage 回退路径测试 |
| `README.md` | 使用说明、构建、已知问题 |
| `serve.mjs` | 静态预览服务器（当前未运行） |

---

## 6. 验证记录

### 已通过

```text
tsc --noEmit                             通过
test-sorting.mjs                         8 算法 × 6 规模随机对拍 + 200/500 元素降采样对拍通过
test-storage.mjs                         localStorage 读写/删除往返通过
test-curriculum.mjs                      10 章 / 50 关 / 250 任务通过
Web E2E（无头 Edge）                     过关、项目 A→B→归档、AI、监控、主题均通过
Pyodide                                  True 输出，判题通过；冷 15s / 热 4ms
SQLite schema                            5 张表在 sqlite3 中执行通过
Tauri release 构建                       成功，exe 32,832,559 bytes
Tauri 窗口创建                           成功创建「码上工坊 · 开发者成长工作台」窗口
Tauri 桌面渲染                           inbox WebView2 回退后完整渲染工作台，持续 24s 无崩溃
```

### 未通过 / 未验证

```text
SQLite 桌面端落库                         桌面已渲染，但自动化子进程无法写 AppData，未验证
Tauri 安装包                              未构建
真实 AI Key 请求                          未验证
监控真实进程                              未实现
```

### 关键时间线

```text
03:55   旧 desktop/码上工坊.exe
12:28   上一轮 target/release 构建（含实验参数）
12:41   重建 target/release（32.8 MB，已移除实验参数）
12:43   直接启动 exe：窗口出现，WebView2 157 仍崩溃
12:45   Edge 158 冒充固定运行时失败（0x8000FFFF）
12:51   补窗口 close/destroy 权限后重建
13:00   确认 EdgeCore 158 作为 WebView2 也崩溃（msedge.dll）
13:03   尝试安装最新 Evergreen 运行时，需要管理员权限，失败
13:05   确认系统 inbox WebView2 152 可正常渲染
13:11   写入自动回退逻辑并重建，验证无环境变量时窗口完整渲染
13:20   文档更新，desktop 副本同步
```

---

## 7. 建议的下一步

**WebView2 崩溃已修复，下一步只做真实双击验证 SQLite。**

1. 直接双击 `desktop/码上工坊.exe`（不要从自动化工具启动）；
2. 确认窗口完整渲染工作台；
3. 检查 `%APPDATA%\com.mashang.workshop\code-workshop.db` 是否生成，`%LOCALAPPDATA%\com.mashang.workshop\startup.log` 是否记录 inbox 回退；
4. 改一个关卡/项目后关闭重开，确认数据恢复；
5. 若要正式分发：在能安装 VS Build Tools 的机器上用 MSVC 重新构建，并生成 NSIS 安装包。

如果真实双击仍空白，优先检查：
- `startup.log` 是否写入；
- 任务管理器里 `msedgewebview2.exe` 的路径是否为 `C:\Windows\System32\Microsoft-Edge-WebView`；
- 可用 `CODE_WORKSHOP_USE_INBOX_WEBVIEW=1` 强制 inbox 运行时，或用 `CODE_WORKSHOP_DISABLE_WEBVIEW_FALLBACK=1` 回到 Evergreen 复现原问题。

---

## 8. 备注

- 本机没有管理员权限，不能安装 VS Build Tools，也不能升级 Evergreen WebView2；
- Microsoft 下载在当前网络可用（已成功下载 294 MB 安装包），但安装需要提权；
- `cargo-xwin` 的 MSVC CRT 下载反复失败，未产出 MSVC 版；
- 当前 exe 是 **Rust GNU + WinLibs** 的非官方构建，不能代表最终发布质量；
- DSH 子进程启动 exe 时，子进程对 `%LOCALAPPDATA%`、`%APPDATA%` 写入被拒绝，启动日志与 SQLite 落库都会受影响；真实双击启动不受此限制。
