import Link from "next/link";
import { siteUrl } from "@/lib/seo";

export default function Breadcrumbs({ category, current }: { category: string; current: string }) {
    const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl }, { "@type": "ListItem", position: 2, name: category }, { "@type": "ListItem", position: 3, name: current }] };
    return (
        <>
            <nav aria-label="Breadcrumb" className="mx-auto flex max-w-6xl items-center gap-2 px-5 pt-5 text-sm text-slate-500 sm:px-8"><Link href="/" className="hover:text-blue-700">Home</Link><span aria-hidden="true">→</span><span>{category}</span><span aria-hidden="true">→</span><span className="font-medium text-slate-700">{current}</span></nav>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        </>
    );
}