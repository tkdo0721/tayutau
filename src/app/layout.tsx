import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tayutau — ここにいる、だれかの声",
  description: "半径500mの匿名つぶやきアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
