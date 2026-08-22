import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "./components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://filevera-shivagoud06s-projects.vercel.app"),
  title: {
    default: "Filevera",
    template: "%s | Filevera",
  },
  description: "Simple, private tools for compressing, converting, merging, splitting and resizing files.",
  applicationName: "Filevera",
  openGraph: {
    title: "Filevera",
    description: "Simple, private tools for everyday file work.",
    siteName: "Filevera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Filevera",
    description: "Fast, private tools for everyday file work.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<SiteFooter /></body>
    </html>
  );
}
