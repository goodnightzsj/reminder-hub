import { PushNotifications } from "@capacitor/push-notifications";

export type PushTokenHandler = (token: string, platform: "ios" | "android") => void | Promise<void>;

/**
 * Register for push notifications and report the device token back via callback.
 * The token should be uploaded to the server so the backend can send targeted
 * notifications via APNs (iOS) or FCM (Android).
 */
export async function registerPushNotifications(onToken: PushTokenHandler): Promise<void> {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (info) => {
    const platform = (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad"))
      ? "ios"
      : "android";
    await onToken(info.value, platform);
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("Push registration error:", err);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received:", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push action:", action);
    // TODO: navigate to the relevant todo/anniversary/subscription based on action.notification.data
  });
}
