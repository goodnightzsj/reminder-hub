import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} antialiased pb-20 sm:pb-0 font-sans bg-base text-primary`}
      >
        <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-40 pointer-events-none" />
        <Providers>
          {children}
          <GlobalToastListener />
          <BottomNav />
          <FloatingActionButton />
        </Providers>
      </body>
    </html>
  );
}
