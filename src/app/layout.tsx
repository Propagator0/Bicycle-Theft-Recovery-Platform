import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hjólið Mitt — Iceland Bicycle Recovery",
  description: "Register a stolen bike, build a visual profile, and match it against AI-analysed images from Iceland's lost & found bike community.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
