import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "./Providers";
import { BottomNav } from "./_components/layout/BottomNav";
import { FloatingActionButton } from "./_components/FloatingActionButton";
import { GlobalToastListener } from "./_components/GlobalToastListener";
import "./globals.css";

export const metadata: Metadata = {
  title: "综合提醒管理平台",
  description: "统一管理 Todo、纪念日、订阅与物品的个人管理面板。",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased pb-20 sm:pb-0 font-sans bg-base text-primary"
      >
        <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-60 pointer-events-none" />
        <div className="fixed inset-0 z-[-1] bg-noise pointer-events-none" />
        <Providers>
          <div id="main-content" className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
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
