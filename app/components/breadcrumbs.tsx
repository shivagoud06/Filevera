import Link from "next/link";
import { siteUrl } from "@/lib/seo";

export default function Breadcrumbs({ category, current }: { category: string; current: string }) {
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: category },
            { "@type": "ListItem", position: 3, name: current }
        ]
    };
    return (
        <>
            <nav aria-label="Breadcrumb" className="mx-auto flex max-w-4xl items-center gap-1.5 px-4 pt-4 text-xs text-slate-500 sm:px-6">
                <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
                <span aria-hidden="true" className="text-slate-300">/</span>
                <span>{category}</span>
                <span aria-hidden="true" className="text-slate-300">/</span>
                <span className="font-medium text-slate-700 truncate">{current}</span>
            </nav>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        </>
    );
}