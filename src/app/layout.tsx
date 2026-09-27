import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KanDelta | Opportunity intelligence for the video internet",
  description:
    "Find the delta before the market does. KanDelta finds where audience attention and creator supply diverge, using Oriane's video intelligence.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }], shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-fg">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
