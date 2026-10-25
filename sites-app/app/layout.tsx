import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "一消入画 · 不急艺术俱乐部",
  description: "六种主题，十八幅海报。空盘消除、每日挑战与真实成绩榜。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
