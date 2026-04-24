import { PushNotifications } from "@capacitor/push-notifications";

export type PushTokenHandler = (token: string, platform: "ios" | "android") => void | Promise<void>;
export type PushErrorHandler = (message: string) => void;

/**
 * Register for push notifications and report the device token back via callback.
 * The token should be uploaded to the server so the backend can send targeted
 * notifications via APNs (iOS) or FCM (Android).
 *
 * `onError` fires when APNs/FCM returns a registration error (async, after the
 * function resolves). Permission denial is NOT treated as an error — it's the
 * user's choice, so we return silently.
 */
export async function registerPushNotifications(
  onToken: PushTokenHandler,
  onError?: PushErrorHandler,
): Promise<void> {
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
    const message = typeof err?.error === "string" && err.error ? err.error : "未知错误";
    onError?.(message);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received:", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push action:", action);
    // TODO: navigate to the relevant todo/anniversary/subscription based on action.notification.data
  });
}
