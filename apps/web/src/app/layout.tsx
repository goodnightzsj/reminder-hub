import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Providers } from "./Providers";
import { BottomNav } from "./_components/layout/BottomNav";
import { FloatingActionButton } from "./_components/FloatingActionButton";
import { GlobalToastListener } from "./_components/GlobalToastListener";
import "./themes.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Reminder Hub",
    template: "%s · Reminder Hub",
  },
  applicationName: "Reminder Hub",
  description: "统一管理待办、纪念日、订阅、物品与通知摘要的个人提醒中心。",
};

// viewport-fit=cover 是 iPhone X+ 刘海/药丸/Home Indicator 生效 env(safe-area-inset-*) 的前提
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Body: Geist（干净、非 Inter）；Display: Space Grotesk（几何感，个性化）。
            CJK 自动回落系统字体（PingFang/Microsoft YaHei/Noto Sans SC）。 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Space+Grotesk:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased pb-20 sm:pb-0 font-sans bg-base text-primary"
      >
        {/* 键盘用户跳过顶部装饰、导航，直达主内容 */}
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[9999] focus-visible:rounded-md focus-visible:bg-brand-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-white focus-visible:shadow-lg"
        >
          跳到主内容
        </a>
        <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-60 pointer-events-none" />
        <div className="fixed inset-0 z-[-1] bg-noise pointer-events-none" />
        <Providers>
          <div id="main-content" tabIndex={-1} className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            {children}
            <Suspense fallback={null}>
              <GlobalToastListener />
            </Suspense>
          </div>
          <BottomNav />
          <FloatingActionButton />
        </Providers>
      </body>
    </html>
  );
}
