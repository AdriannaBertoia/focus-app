import type { Metadata } from "next";
import { Josefin_Sans, Sarabun } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { BrainDumpFAB } from "@/components/BrainDumpFAB";
import { RecordingPrompt } from "@/components/RecordingPrompt";

const sarabun = Sarabun({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-body" });
const josefin = Josefin_Sans({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Focus",
  description: "ADHD-friendly productivity companion",
  manifest: "/manifest.json",
  themeColor: "#6366F1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Focus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sarabun.variable} ${josefin.variable}`}>
        <main className="pb-24 min-h-dvh">
          <RecordingPrompt />
          {children}
        </main>
        <BrainDumpFAB />
        <BottomNav />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
