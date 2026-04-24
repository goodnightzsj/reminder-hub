# Reminder Hub

> 跨平台个人提醒管理 · 待办 / 纪念日 / 订阅 / 物品 · 本地优先 + 可选服务器同步

---

## 下载

前往 [Releases](https://github.com/goodnightzsj/reminder-hub/releases/latest) 下载对应平台版本。

### 桌面 (Tauri)

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `*_x64_en-US.msi` | **推荐**，MSI 安装包 |
| Windows | `*_x64-setup.exe` | NSIS 安装包 |
| macOS Apple Silicon | `*_aarch64.dmg` | M1 / M2 / M3 / M4 |
| macOS Intel | `*_x64.dmg` | Intel 芯片 |
| Linux Debian/Ubuntu | `*_amd64.deb` | `sudo dpkg -i` |
| Linux 通用 | `*_amd64.AppImage` | `chmod +x && ./...` |

> 未签名版 macOS 首次打开需右键 → 打开 绕过 Gatekeeper；Windows SmartScreen 弹窗点 "更多信息" → "仍要运行"。

### Android (Capacitor)

| 文件 | 说明 |
| --- | --- |
| `app-release.apk` / `*.aab` | 签名版（需 repo 配置 keystore secrets） |
| `app-debug.apk` | fallback，无 secrets 时自动产出，可侧载测试 |

### iOS (Capacitor)

| 文件 | 说明 |
| --- | --- |
| `*.ipa` | 签名版（需 Apple Developer secrets），通过 Transporter 上传 App Store Connect |
| `App-simulator.app.tar.gz` | fallback，模拟器构建 |

```bash
# 模拟器安装
tar -xzf App-simulator.app.tar.gz
xcrun simctl install booted App.app
xcrun simctl launch booted com.reminderhub.mobile
```

### Docker (Web 服务端)

Web 服务端镜像按 `v*` tag 自动推送到 Docker Hub。从 `latest` 拉最新：

```bash
docker pull <your-dockerhub-user>/reminder-hub:latest
docker run -d -p 3000:3000 <your-dockerhub-user>/reminder-hub:latest
```

---

## 系统要求

| OS | 最低版本 | 架构 |
| --- | --- | --- |
| Windows | 10+ | x64 |
| macOS | 12 Monterey+ | Intel / Apple Silicon |
| Linux | 现代发行版 | x64 |
| Android | 7.0+ (API 24) | arm64-v8a / armeabi-v7a |
| iOS | 13+ | arm64 |

---
