import { RemoteApiError } from "@reminder-hub/datastore";

const CODE_MESSAGES: Record<string, string> = {
  unauthorized: "未登录或会话已过期",
  forbidden: "没有访问权限",
  not_found: "资源不存在",
  bad_request: "请求格式错误",
  server_error: "服务器错误，请稍后再试",
};

export function localizeError(err: unknown): string {
  if (err instanceof RemoteApiError) {
    if (err.code && CODE_MESSAGES[err.code]) return CODE_MESSAGES[err.code];
    if (err.status === 401) return CODE_MESSAGES.unauthorized;
    if (err.status === 403) return CODE_MESSAGES.forbidden;
    if (err.status === 404) return CODE_MESSAGES.not_found;
    if (err.status >= 500) return CODE_MESSAGES.server_error;
    return err.message || "请求失败";
  }

  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("load failed")) {
      return "无法连接到服务器，请检查网络";
    }
  }

  if (err instanceof Error) return err.message;
  return String(err);
}
