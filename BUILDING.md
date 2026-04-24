# 构建与发布

仓库内置三个 GitHub Actions workflow 用于自动打包多端：

| Workflow 文件 | 触发方式 | 产物 | Runner | 证书要求 |
|---|---|---|---|---|
| `.github/workflows/docker-publish.yml` | 推送到 `main` / 打 `v*` 标签 | Docker 镜像到 Docker Hub | Ubuntu | Docker Hub token |
| `.github/workflows/desktop-release.yml` | 打 `desktop-v*` 标签 / 手动 | `.msi`/`.exe`/`.dmg`/`.AppImage`/`.deb` | Win + macOS + Ubuntu | 无（可选） |
| `.github/workflows/android-release.yml` | 打 `android-v*` 标签 / 手动 | `.apk` + `.aab` | Ubuntu | 可选 keystore |
| `.github/workflows/ios-release.yml` | 打 `ios-v*` 标签 / 手动 | `.ipa` | macOS | 必需 Apple Developer |

---

## 1. Web (Docker)

已经在工作中，推送 `main` 即触发。

```bash
git push origin main            # main 分支自动构建 latest 镜像
git tag v0.2.0 && git push --tags   # 标签构建对应版本镜像
```

镜像位置：`helloworldz1024/reminder-hub:latest`

---

## 2. 桌面（Tauri，Win / Mac / Linux）

**完全不用任何证书**即可出可运行的安装包。签名是可选的（未签名 macOS 会弹"未验证开发者"警告，需用户手动允许）。

### 手动测试构建
在 GitHub → Actions → Desktop Release → Run workflow，选 main 分支。
产物上传为 artifacts：`desktop-win-x64`、`desktop-mac-arm64`、`desktop-mac-x64`、`desktop-linux-x64`。

### 发布版本
```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```
四个平台并行构建，产物自动创建一个 GitHub Draft Release，你检查后点 Publish。

### 可选：代码签名

macOS（推荐，避免 Gatekeeper 警告）：
```
Secrets 需要：
  APPLE_SIGNING_IDENTITY     例如 "Developer ID Application: Your Name (TEAMID)"
  APPLE_ID                   Apple ID 邮箱
  APPLE_PASSWORD             App 专用密码（在 appleid.apple.com 生成）
  APPLE_TEAM_ID              10 字符的 Team ID
```

Windows：
```
Secrets 需要：
  WINDOWS_CERTIFICATE              base64 编码的 .pfx 证书
  WINDOWS_CERTIFICATE_PASSWORD     证书密码
```

Tauri 自动更新（可选）：
```
Secrets 需要：
  TAURI_SIGNING_PRIVATE_KEY            `tauri signer generate` 生成的私钥
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD   私钥密码
```

---

## 3. Android

**调试 APK**（本地 sideload 用，不需要签名）：
在 GitHub → Actions → Android Release → Run workflow → Build type: `debug`。
产物：`android-debug-apk` artifact 里的 `.apk`。

**发布版本**（签名 APK + AAB）：

### 第一步：生成 keystore（只需一次）
```bash
keytool -genkey -v \
  -keystore reminder-hub.keystore \
  -alias reminder-hub \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```
记下你输入的两个密码（keystore 密码 + key 密码）和 alias。**这个文件丢失就永远没法更新应用**，请妥善备份。

### 第二步：上传到 GitHub Secrets
```bash
# 把 keystore 转成 base64
base64 -w0 reminder-hub.keystore > keystore.base64.txt
cat keystore.base64.txt   # 复制内容
```

仓库 Settings → Secrets and variables → Actions → New repository secret：

| Secret 名 | 值 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | 上面 `keystore.base64.txt` 的内容 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | alias（如 `reminder-hub`） |
| `ANDROID_KEY_PASSWORD` | key 密码（通常和 keystore 密码相同） |

### 第三步：让 build.gradle 使用 secrets
Capacitor 生成的默认 `android/app/build.gradle` 没配置 release 签名。workflow 会写入 gradle.properties，但还需要在 `android/app/build.gradle` 的 `android { }` 块里加：

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('RELEASE_STORE_FILE')) {
                storeFile file(RELEASE_STORE_FILE)
                storePassword RELEASE_STORE_PASSWORD
                keyAlias RELEASE_KEY_ALIAS
                keyPassword RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

这个配置需要提交到仓库（在 `npx cap add android` 之后修改 `android/app/build.gradle`）。

### 第四步：发布
```bash
git tag android-v0.1.0
git push origin android-v0.1.0
```

---

## 4. iOS

这是最复杂的，**必须有 Apple Developer 账号**（$99/年）。

### 准备工作

1. **在 Apple Developer Portal**：
   - 注册 Bundle ID：`com.reminderhub.mobile`（或你自己的）
   - 创建 Distribution Certificate → 下载为 `.p12`
   - 创建 App Store Provisioning Profile → 下载 `.mobileprovision`

2. **登录 appleid.apple.com**：
   - 生成 App-specific password（给 Transporter 上传用）

3. **上传 Secrets**：

| Secret 名 | 取值 |
|---|---|
| `IOS_P12_BASE64` | `base64 -i certificate.p12` |
| `IOS_P12_PASSWORD` | .p12 导出时设置的密码 |
| `IOS_PROVISIONING_PROFILE_BASE64` | `base64 -i profile.mobileprovision` |
| `IOS_PROVISIONING_PROFILE_NAME` | Profile 在 Apple Portal 的名字（不含 .mobileprovision） |
| `APPLE_TEAM_ID` | 10 字符 Team ID |
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com 生成的专用密码 |
| `IOS_KEYCHAIN_PASSWORD` | 任意随机字符串（临时 keychain 密码） |

### 发布
```bash
git tag ios-v0.1.0
git push origin ios-v0.1.0
```

产出 `.ipa`，之后用 Transporter 或 `xcrun altool` 上传到 App Store Connect。

### 只想测试 pipeline（不签名）
在 Actions → iOS Release → Run workflow。产出 unsigned archive artifact，可在本地 Xcode 里打开确认构建成功，但不能安装到设备。

---

## 5. 自定义应用配置

改动下列位置来匹配你的品牌：

| 位置 | 改什么 |
|---|---|
| `apps/desktop/src-tauri/tauri.conf.json` | `productName`, `identifier`, 窗口大小 |
| `apps/desktop/src-tauri/icons/` | 替换 `32x32.png` 等为你自己的 logo |
| `apps/mobile/capacitor.config.ts` | `appId`, `appName` |
| `apps/mobile/android/app/src/main/res/` | 生成后替换图标（首次 `cap add android` 后） |
| `apps/mobile/ios/App/App/Assets.xcassets/` | 生成后替换 AppIcon |

Capacitor 可以用 `@capacitor/assets` 一键生成各尺寸图标：
```bash
cd apps/mobile
npm install -g @capacitor/assets
# 放 1024x1024 源图到 assets/icon-only.png
npx capacitor-assets generate
```
