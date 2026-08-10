import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { BrainDumpFAB } from "@/components/BrainDumpFAB";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Focus",
  description: "ADHD-friendly productivity companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <main className="pb-24 min-h-dvh">
          {children}
        </main>
        <BrainDumpFAB />
        <BottomNav />
      </body>
    </html>
  );
}
