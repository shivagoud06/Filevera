import type { Metadata } from "next";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  (process.env.NODE_ENV === "production" ? "https://fileveraio.vercel.app" : "http://localhost:3000");

export function pageMetadata(path: string, title: string, description: string): Metadata {
    const url = new URL(path, siteUrl).toString();
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: "Filevera", type: "website" },
        twitter: { card: "summary", title, description },
    };
}