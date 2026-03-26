import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tayutau — 場所に残しただれかの声",
  description: "半径500mの匿名つぶやきアプリ",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
