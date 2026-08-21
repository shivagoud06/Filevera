import Link from "next/link";

export default function SiteFooter() {
    return (
        <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-300">
            <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 text-sm sm:grid-cols-3 sm:px-8">
                <div><Link href="/" className="text-lg font-black text-sky-400">File<span className="text-white">vera</span></Link><p className="mt-2 max-w-xs leading-6">Simple tools for every file.</p></div>
                <div><h2 className="font-semibold text-white">Tools</h2><div className="mt-3 grid gap-2"><Link href="/compress-pdf" className="hover:text-sky-400">Compress PDF</Link><Link href="/merge-pdf" className="hover:text-sky-400">Merge PDF</Link><Link href="/split-pdf" className="hover:text-sky-400">Split PDF</Link><Link href="/image-compressor" className="hover:text-sky-400">Compress Image</Link><Link href="/image-resizer" className="hover:text-sky-400">Resize Image</Link></div></div>
                <div><h2 className="font-semibold text-white">Product</h2><div className="mt-3 grid gap-2"><Link href="/contact" className="hover:text-sky-400">Contact</Link><Link href="/privacy" className="hover:text-sky-400">Privacy</Link><Link href="/terms" className="hover:text-sky-400">Terms</Link></div></div>
            </div>
            <div className="border-t border-slate-800 px-5 py-3 text-center text-xs text-slate-400">© {new Date().getFullYear()} Filevera</div>
        </footer>
    );
}