# Reminder Hub Mobile

Capacitor 7 原生移动客户端 — Android / iOS。

## 前置依赖

- **Node.js 20+**
- **Android 构建**：
  - Android Studio（SDK 34+、Gradle）
  - Java 17+
- **iOS 构建**（仅 macOS）：
  - Xcode 15+
  - CocoaPods（`sudo gem install cocoapods`）

## 初始化原生工程

首次拉代码后：

```bash
# 从仓库根目录
npm install

# 在 apps/mobile 目录
cd apps/mobile
npx cap add android
npx cap add ios         # macOS only
```

这会生成 `android/` 和 `ios/` 目录（不需要提交到仓库）。

## 开发流程

```bash
# 1. 构建前端 + 同步到原生工程
npm run build
npm run sync

# 2. 在原生 IDE 里运行
npm run android         # 或 npx cap open android
npm run ios             # 或 npx cap open ios
```

## 发布构建

### Android

```bash
npm run android:build
```

产物：`android/app/build/outputs/apk/release/app-release.apk` 或 `.aab`。

需在 `android/app/build.gradle` 中配置签名 keystore，首次需要生成：

```bash
keytool -genkey -v -keystore reminder-hub.keystore -alias reminder-hub -keyalg RSA -keysize 2048 -validity 10000
```

### iOS

```bash
npm run ios:build
```

然后在 Xcode 里打开 `ios/App/App.xcworkspace` → Product → Archive → 上传到 App Store Connect。

需要 Apple Developer 账号 ($99/年)，以及：
- Bundle ID 注册（`com.reminder-hub.mobile`）
- Provisioning Profile

## 推送通知设置

### Android（FCM）

1. 在 Firebase Console 创建项目
2. 下载 `google-services.json` 放到 `android/app/`
3. 在 `android/build.gradle` 添加 `com.google.gms:google-services` classpath
4. 在 `android/app/build.gradle` 底部加 `apply plugin: 'com.google.gms.google-services'`

### iOS（APNs）

1. 在 Apple Developer Portal 启用 Push Notifications capability
2. 上传 APNs Auth Key 到服务端配置
3. Xcode → Signing & Capabilities → 勾选 Push Notifications 和 Background Modes (Remote notifications)

应用启动时会请求推送权限，得到 token 后通过 `POST /api/v1/push/register` 上传给后端（需要先登录连接远端）。

## 数据模式

与桌面端一致：本地优先 / 纯云端两种，在应用内首次启动的配置面板选择。

本地 SQLite 路径：
- **iOS**：`~/Library/CapacitorDatabase/reminder-hub.db`（App sandbox）
- **Android**：App 内部存储

## 调试

```bash
# 查看日志（Android）
adb logcat -s Capacitor:V WebView:V

# Safari Web Inspector（iOS）：模拟器 Safari → 开发菜单 → 选择设备 → 选择 WebView
```
