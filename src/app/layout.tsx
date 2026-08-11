import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { RecordingPrompt } from "@/components/RecordingPrompt";
import { ShutdownSweep } from "@/components/ShutdownSweep";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Focus",
  description: "ADHD-friendly productivity companion",
  manifest: "/manifest.json",
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
      <body className={`${dmSans.variable} ${playfair.variable}`}>
        <div className="flex min-h-dvh">
          <Sidebar />
          <main className="flex-1 min-h-dvh overflow-y-auto">
            <RecordingPrompt />
            <ShutdownSweep />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
