import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YakuNote",
  description: "URL要約サービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        {/* ヘッダー */}
        <header className="w-full flex items-center justify-start px-8 py-4 shadow-sm bg-white">
          <Link href="/" className="text-2xl font-bold text-indigo-600 cursor-pointer">
            YakuNote
          </Link>
        </header>

        {/* 各ページの中身 */}
        <main>{children}</main>
      </body>
    </html>
  );
}
