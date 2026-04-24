# Reminder Hub Desktop

Tauri 2 桌面客户端 — Windows / macOS / Linux。

## 前置依赖

- **Node.js 20+**
- **Rust 工具链**：
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- **Tauri CLI**（本仓库已作为 dev dependency）
- **系统级构建依赖**：
  - **Linux**：`sudo apt install libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev patchelf`
  - **macOS**：Xcode Command Line Tools（`xcode-select --install`）
  - **Windows**：Visual Studio 2022 Build Tools + WebView2 Runtime

## 开发

```bash
# 从仓库根目录
npm install
npm run desktop:dev
```

首次会下载 Rust 依赖（~5 分钟）。之后每次热重载秒级。

## 构建产物

```bash
npm run desktop:build
```

产物位置：`apps/desktop/src-tauri/target/release/bundle/`

- **Windows**：`.msi` 和 `.exe` 安装包
- **macOS**：`.dmg` 和 `.app`
- **Linux**：`.AppImage` 和 `.deb`

## 数据模式

首次启动在"设置"面板选择：

- **本地优先（推荐）**：数据存在 `~/Library/Application Support/com.reminder-hub.desktop/reminder-hub.db`（macOS 路径，其他平台类似的 app data 目录）；可选填入服务器地址+密码，启用后后台同步到云端
- **纯云端**：所有读写走 `{服务器地址}/api/v1/*`，离线不可用

服务器地址示例：`https://reminder.9962510.xyz`。密码即 Web 端的管理密码。

## Icon 资源

`src-tauri/icons/` 目录需要放置以下文件（Tauri 初始化时会自动生成）：
- `32x32.png`, `128x128.png`, `128x128@2x.png`
- `icon.icns`（macOS）, `icon.ico`（Windows）

可用 `tauri icon path/to/source.png` 一键从 1024x1024 源图生成。
