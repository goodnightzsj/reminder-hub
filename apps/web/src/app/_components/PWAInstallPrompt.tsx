"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px] z-[100] animate-slide-up">
      <div className="rounded-2xl bg-glass shadow-xl border border-default p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0">
          <Icon icon="ri:download-2-line" className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-primary">安装 Reminder Hub</div>
          <div className="text-xs text-secondary mt-0.5">
            添加到主屏以获得独立应用体验。
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={install}
              className="h-8 px-3 rounded-lg bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-xs font-medium active-press"
            >
              安装
            </button>
            <button
              onClick={dismiss}
              className="h-8 px-3 rounded-lg border border-default bg-transparent text-xs font-medium text-secondary active-press"
            >
              不再提示
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
