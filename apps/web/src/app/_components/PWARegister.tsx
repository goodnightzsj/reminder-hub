"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // 注意：不在 controllerchange 里 window.location.reload()。
        // sw.js install 已经 self.skipWaiting()，activate 又 clients.claim()，
        // 加上 DevTools 的 "Update on reload" 会形成
        //   reload → SW 升级 → claim → controllerchange → reload → ...
        // 的死循环。新版 SW 在下次正常导航后接管即可，无需强刷。
        // 需要"提示用户有新版"时，应在 UI 显示横幅而非偷偷自动 reload。
      } catch {
        // SW registration failures are non-fatal.
      }
    };

    register();
  }, []);

  return null;
}
