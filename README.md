# 码上工坊 · 开发者成长工作台

按照《码上工坊 · 开发者成长工作台》v1.1 项目文档实现的 **P0 全流程工作台**：可视化学习、语法闯关、项目交付、AI 协作训练、运行监控和成长档案收进同一个界面。

当前包含两种运行形态：

- **Web 预览版**：Vite + React，`http://127.0.0.1:4173`；
- **Tauri 2 桌面壳**：Rust + WebView2，数据走 SQLite；便携 exe 由本地构建生成，不提交到仓库；
- **Python 真实执行**：关卡挑战由 Pyodide（CPython 3.14 WASM）在 Web Worker 中运行，按 stdout 判题。

> 当前剩余工作、未解决问题和验证缺口，统一记录在 [REMAINING_WORK.md](REMAINING_WORK.md)。

![工作台暗色 · 蓝黑主题](https://cdn.jsdelivr.net/gh/wenbinZ1/code-workshop@main/docs/workbench-dark.png)

![工作台亮色 · 冷蓝主题](https://cdn.jsdelivr.net/gh/wenbinZ1/code-workshop@main/docs/workbench-light.png)

## 快速开始

### Web 预览

```bash
npm install
npm run dev        # http://127.0.0.1:5178
# 或
npm run build
npm run serve      # http://127.0.0.1:4173
```

### Tauri 2 桌面壳

```bash
npm install
npm run tauri:dev     # 开发模式，自动启动 Vite + Tauri
npm run tauri:build   # 构建 exe；默认不生成安装包
```

构建产物（仅本地存在，已被 `.gitignore` 排除）：

```
src-tauri/target/release/code-workshop.exe
desktop/码上工坊.exe
desktop/WebView2Loader.dll
```

Windows 上官方推荐 **MSVC** 工具链 + Visual Studio C++ Build Tools。本机没有管理员权限，实际使用 **Rust GNU + WinLibs MinGW + 无默认 manifest 的 GCC specs** 构建；桌面端会自动处理 WebView2 157 的兼容崩溃，见下方「桌面端 WebView2 崩溃（已修复）」。

## 这一轮新增

### 1. Tauri 2 桌面壳

- `src-tauri/`：`Cargo.toml`、`build.rs`、`tauri.conf.json`、capabilities、图标；
- 窗口 1440×900，最小 1280×720，标题「码上工坊 · 开发者成长工作台」；
- `beforeBuildCommand` 复用前端 `npm run build`，`frontendDist` 指向 `../dist`；
- 前端 HashRouter 在 Tauri 自定义协议下可直接工作；
- Rust 入口注册 `tauri-plugin-sql`，并执行 SQLite migration。

### 2. SQLite 持久化

Tauri 环境自动从 localStorage 切到 SQLite，Web 环境保留 localStorage 回退。

```
tauri-plugin-sql  sqlite:code-workshop.db
├── workshop_state     # 整份 Zustand 档案快照（JSON）
├── workshop_meta      # 最近保存时间 / schema 版本
├── workshop_events    # 事件镜像（SQL 可查）
├── workshop_sessions  # 学习会话镜像
└── workshop_projects  # 项目 / 阶段 / 评分镜像
```

- `src/lib/persistence.ts`：Zustand `PersistStorage` 适配器；
- SQLite 写入用 `workshop_state.payload`，并节流同步三张镜像表；
- `partialize` 排除 actions，`merge` 始终保留当前 action 集合，避免刷新后按钮失效；
- 首次启动显示「正在读取本地档案…」的 hydration 屏；
- 设置页会显示当前存储后端：`SQLite · tauri-plugin-sql` 或 `浏览器 localStorage`；
- capability 已授予 `sql:default` + `sql:allow-execute`（默认集合只含 load/select/close，不含写操作），并额外授予 `core:window:allow-close` / `allow-destroy`，用于关闭窗口前先 flush 数据。

### 3. Pyodide 真实判题

- `src/workers/python.worker.ts`：加载 `public/pyodide/` 下的 Pyodide 资源；
- `src/lib/pythonRunner.ts`：30 秒执行超时，超时终止 Worker 并重建；
- 关卡挑战页新增「运行代码」与「运行检查」两个动作；
- 判题流程：先做结构检查，再真实执行，比较 `stdout` 与期望输出；
- 输出面板显示 stdout、stderr、表达式结果和耗时；
- 含文件读写 / 随机数的题目标记为 `executable: false`，按规则判定；
- 首次加载 Pyodide 约 2–15 秒（取决于磁盘/CPU），之后毫秒级；进入挑战页会预热。

实际验证：在无头 Edge 中运行 `score = 90; passed = score >= 60; print(passed)`，Pyodide 输出 `True`，判定通过；冷启动 15.0s，热执行 4ms。

### 4. 稳定性与数据可靠性（本轮）

- **移除实验性 WebView2 参数**：`additionalBrowserArgs`（`--no-sandbox --single-process --disable-gpu`）已删除，恢复默认渲染参数；
- **退出前 flush**：页面隐藏 / `beforeunload` / Tauri 窗口关闭时立即写镜像表，修复退出前最后 2.5 秒镜像丢失；
- **镜像同步尾部调度**：节流窗口内的最后一次写入会在窗口结束后补写，不再被直接丢弃；
- **localStorage → SQLite 一次性迁移**：桌面端首次启动且 SQLite 为空时，自动导入网页版旧档案，并保留 localStorage 作为备份；
- **hydration 超时兜底**：5 秒内没读到档案时显示「先进入工作台」，不会一直停在启动屏；
- **可见错误提示**：全局 `error` / `unhandledrejection` 与 React ErrorBoundary 会渲染错误面板；Tauri 启动失败会写入 `%LOCALAPPDATA%\com.mashang.workshop\startup.log` 并弹出系统错误对话框；
- **排序实验室支持 500 元素**：大数组动画按帧抽样、柱状图按桶聚合，并新增「性能基准」面板（8 算法耗时 / 比较 / 交换 / 帧数）。

### 5. 成长激励与交互动效（本轮）

- **用户数据初始化**：首次启动从 Lv.1 / 0 XP / 空学习记录开始；设置页可随时「初始化数据」，只重置成长档案，保留主题、昵称与 AI 配置；
- **每日任务**：学习 15 分钟、通关 1 关、跑通 1 种排序、向 AI 提问 1 次，完成后手动领取 XP，每日 0 点刷新；
- **成就墙**：14 个里程碑覆盖关卡、XP、排序、项目、AI、连续学习、星级与目标；
- **丝滑动效**：路由切换使用 View Transitions 淡入淡出，页面区块逐层上浮；卡片柔光跟随鼠标、按钮点击涟漪与悬停高光，并遵循「减弱动效」设置。


## 已实现的完整流程

| 模块 | 实现内容 |
|---|---|
| 工作台首页 | 4 个 KPI；每日任务；14 天折线、六维雷达、学习岛进度环、项目脉搏、模块投入、8 周热力图、事件时间线 |
| 排序实验室 | 8 种排序；10–500 元素；播放/暂停/单步/倍速/换数据；双栏对比；伪代码高亮；大数组帧抽样 + 柱状图聚合 + 性能基准 |
| Python 语法闯关 | 10 章 × 5 关 × 5 任务（250 个）；概念→单选→填空→拼装→代码挑战；Pyodide 真实执行；提示/重试/星级/XP/顺序解锁/复习 |
| 项目工坊 | 8 个模板；两阶段门禁；看板；阶段 A 基线快照；手动快照/回滚；四维评分；归档作品集 |
| AI 训练场 | 24 个提示词模板；搜索/收藏/填入；OpenAI 兼容配置；无 Key 演示；六步工作流；三角色对比 |
| 监控台 | 8 个模块启动/停止/重启；CPU/内存/FPS/运行时长；异常模拟与恢复；日志筛选；时间线 |
| 成长档案 | 雷达、14 天时长、模块投入、8 周热力图、阶段目标、14 项成就墙、作品集、周报生成/Markdown/打印 PDF |
| 设置 | 暗/亮/跟随系统、减弱动效、昵称、档案导出/导入/初始化、AI 配置、存储后端显示 |

## 已验证

- `tsc --noEmit` 通过；
- 8 种排序 × 6 种规模 × 8 轮随机对拍全部通过；
- 500 元素降采样排序对拍通过（8 算法 × 200/500，最终数组有序、帧数受控）；
- 10 章 / 50 关 / 250 任务结构校验通过；
- 存储回退测试通过（无 Tauri 时 localStorage 读写/删除往返）；
- 生产构建成功；
- 无头 Edge 实际执行：过关、刷新续做、项目 A→B→归档、AI 对话、六步工作流、监控异常恢复、主题切换，控制台无异常；
- Pyodide 在真实浏览器中执行并判题通过；
- SQLite migration 的 5 张表用 sqlite3 执行验证通过；
- Tauri release exe 构建成功（32.8 MB），并生成 `WebView2Loader.dll`；
- 桌面端自动回退 inbox WebView2 后，窗口完整渲染工作台并持续运行（截图验证）。

## 桌面端 WebView2 崩溃（已修复）

**现象**：Tauri exe 能创建窗口，但 WebView2 进程在 `msedge_elf.dll` / `msedge.dll` 中以 `0x80000003`（STATUS_BREAKPOINT）崩溃，窗口空白、应用退出。

**定位**：

- 只影响 `msedgewebview2.exe`，Edge 浏览器本身正常；
- 删除实验性 `additionalBrowserArgs`、清空 WebView2 用户数据目录、结束残留 `msedgewebview2.exe` 均无效；
- 把 Edge 158 的 EdgeCore 作为固定运行时仍然崩溃（故障模块变成 `msedge.dll`）；
- 系统自带的 inbox WebView2（`C:\Windows\System32\Microsoft-Edge-WebView`，152.0.4191.53）可以正常渲染；
- 属于 Windows 11 25H2（Build 26200）+ Evergreen WebView2 157 的运行时兼容问题，应用代码无法修复运行时本身。

**修复**（[lib.rs](file:///d:/DshProject/code-workshop/src-tauri/src/lib.rs) 的 `prefer_working_webview_runtime()`）：

- 启动、创建窗口前检查 Evergreen WebView2 版本；
- 运行时缺失，或主版本为已知有问题的 **157.x** 时，自动把 `WEBVIEW2_BROWSER_EXECUTABLE_FOLDER` 指向系统 inbox WebView2；
- 其他版本不干预，保持用户已安装的 Evergreen 运行时；
- `CODE_WORKSHOP_USE_INBOX_WEBVIEW=1` 可强制使用 inbox 运行时；`CODE_WORKSHOP_DISABLE_WEBVIEW_FALLBACK=1` 可关闭回退。

**验证**（2026-11-21 13:11 构建，无任何环境变量）：

- 子进程路径为 `C:\Windows\System32\Microsoft-Edge-WebView\msedgewebview2.exe`；
- 窗口标题「码上工坊 · 开发者成长工作台」，`PrintWindow` 截图完整渲染工作台（侧边栏、KPI、折线图）；
- 持续运行 24 秒，无崩溃、无新增 Application Error 事件；
- 本地构建后可把 exe 与 `WebView2Loader.dll` 复制到 `desktop/`（该目录不入库，发布请走 GitHub Releases）。

**残留限制**：inbox 运行时版本比 Evergreen 旧（152 vs 157），这是绕开本机运行时崩溃的兼容性回退；后续 WebView2 升级到修复版本后，代码会自动回到 Evergreen。桌面端 SQLite 落库仍受自动化环境影响（工具启动的子进程无法写 `%LOCALAPPDATA%` / `%APPDATA%`），需真实双击启动后确认。

## 技术栈与目录

- React 18 + TypeScript + Vite 6
- Zustand 5（persist；Tauri 下 SQLite，Web 下 localStorage）
- Tauri 2 + `tauri-plugin-sql`（SQLite）
- Pyodide 3.14 WASM + Web Worker
- ECharts 5 / CodeMirror 6 / React Router 6（HashRouter）

```
code-workshop/
├── src/
│   ├── components/ charts / shell / ui
│   ├── data/       课程、项目模板、提示词
│   ├── lib/        persistence、pythonRunner、sorting
│   ├── pages/      8 个页面
│   ├── stores/     Zustand + persist
│   ├── workers/    python.worker.ts
│   └── styles/
├── public/pyodide/ Pyodide 运行时（wasm / stdlib / lock）
├── src-tauri/      Tauri 2 外壳、SQLite migration、图标
├── desktop/        本地便携 exe（git 忽略）
├── docs/           截图
├── serve.mjs       静态预览服务器
├── test-sorting.mjs
└── test-curriculum.mjs
```

## 隐私与开源说明

- **数据只在本机**：学习档案写入桌面端 SQLite 或浏览器 localStorage，不上传服务器，也没有遥测埋点。
- **AI Key 默认留空**：只有手动填写后才会保存在本机档案中；仓库不包含任何 API Key、账号、Token 或本机绝对路径。
- **凭据与产物不入库**：`.gitignore` 已排除 `.env*`、`*.pem`、`*.key`、日志、`dist/`、`desktop/` 与 Rust 构建目录；桌面端二进制通过 GitHub Releases 分发。
- **初始化状态**：截图中的昵称与 0 XP 是首次启动的空白档案，不含真实个人数据。

## 测试

```bash
npm run typecheck
npm run test:sort
npm run test:storage
npm run test:curriculum
npm run build
npm run tauri:build
```

Tauri 构建需要：

- Rust（官方推荐 `x86_64-pc-windows-msvc`）；
- Visual Studio C++ Build Tools（MSVC + Windows SDK）；
- WebView2 Runtime。

本机实际使用 GNU 工具链。若链接时出现 `multiple non-default manifests`，可加 `-C link-arg=-specs=<项目目录>/.toolchain/no-default-manifest.specs` 复用仓库里的 GCC specs；这是本机构建环境的 workaround，不应作为正式发布链路。

## 与文档 v1.1 的差距

| 文档要求 | 当前状态 | 下一步 |
|---|---|---|
| Tauri 2 桌面外壳 | 已实现并构建 exe；WebView2 崩溃已用 inbox 运行时回退修复；启动失败有日志与错误对话框 | 在 MSVC + 干净 WebView2 环境复验；补 NSIS 安装包 |
| SQLite / WAL | 已实现 SQLite 插件 + 5 张表 + 镜像 + 退出 flush + 旧档案迁移 | 桌面端运行验证；后续把整份 JSON 拆成强类型 repository |
| Python 真实执行沙箱 | Pyodide 真实执行 + 30s 超时 | 文件/随机题接入虚拟文件系统；补资源限制 |
| 项目真实进程与日志 | 应用内看板 / 模拟状态 | 接子进程、健康检查与日志采集 |
| 10 个项目同时监控 | 8 个模块模拟 | 接真实 pid / metrics 后压测 |
| Monaco Editor | CodeMirror 6 | 需要更接近 VS Code 时替换 |
| 500 元素排序 | 已支持 10–500：帧抽样 + 柱状图聚合 + 8 算法性能基准 | 如需逐帧观察 500 元素，可进一步改 Canvas 渲染 |

项目文档为仓库外的交付物，不随源码仓库分发。

## License

[MIT](LICENSE) © 2026 Code Workshop
