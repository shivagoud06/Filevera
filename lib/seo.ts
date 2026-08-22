import type { Metadata } from "next";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://filevera-shivagoud06s-projects.vercel.app";

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