import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Todo List",
  description: "Personal life management dashboard",
};

import { Providers } from "./Providers";
import { BottomNav } from "./_components/BottomNav";
import { FloatingActionButton } from "./_components/FloatingActionButton";
import { GlobalToastListener } from "./_components/GlobalToastListener";

// ... (Metadata stays same)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased pb-20 sm:pb-0 font-sans bg-base text-primary`}
      >
        <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-60 pointer-events-none" />
        <div className="fixed inset-0 z-[-1] bg-noise pointer-events-none" />
        <Providers>
          <div id="main-content" className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            {children}
            <GlobalToastListener />
          </div>
          <BottomNav />
          <FloatingActionButton />
        </Providers>
      </body>
    </html>
  );
}
