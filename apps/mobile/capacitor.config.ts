import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.reminder-hub.mobile",
  appName: "Reminder Hub",
  webDir: "dist",
  server: {
    // During dev you can point to a local dev server:
    // url: "http://10.0.2.2:5173",
    // cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/CapacitorDatabase",
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
