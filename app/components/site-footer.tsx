import Link from "next/link";

export default function SiteFooter() {
    return (
        <footer className="mt-auto border-t border-slate-200/80 bg-white text-slate-600">
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-5 sm:px-6 sm:py-10">
                <div className="sm:col-span-2">
                    <Link href="/" className="text-lg font-black text-sky-500">
                        File<span className="text-slate-900">vera</span>
                    </Link>
                    <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                        Simple tools for every file. Fast, secure, and private browser-based utilities.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span>🔒 256-bit TLS Encrypted</span>
                        <span>•</span>
                        <span>⚡ Zero Install</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product</h3>
                    <ul className="mt-2.5 space-y-2 text-xs">
                        <li><Link href="/compress-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">Compress PDF</Link></li>
                        <li><Link href="/merge-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">Merge PDF</Link></li>
                        <li><Link href="/split-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">Split PDF</Link></li>
                        <li><Link href="/jpg-to-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">JPG to PDF</Link></li>
                        <li><Link href="/pdf-to-jpg" className="text-slate-600 hover:text-sky-600 transition-colors">PDF to JPG</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Images</h3>
                    <ul className="mt-2.5 space-y-2 text-xs">
                        <li><Link href="/image-compressor" className="text-slate-600 hover:text-sky-600 transition-colors">Compress Image</Link></li>
                        <li><Link href="/image-resizer" className="text-slate-600 hover:text-sky-600 transition-colors">Resize Image</Link></li>
                        <li><Link href="/compress-image-to-50kb" className="text-slate-600 hover:text-sky-600 transition-colors">Compress to 50KB</Link></li>
                        <li><Link href="/compress-image-to-100kb" className="text-slate-600 hover:text-sky-600 transition-colors">Compress to 100KB</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal & Support</h3>
                    <ul className="mt-2.5 space-y-2 text-xs">
                        <li><Link href="/contact" className="text-slate-600 hover:text-sky-600 transition-colors">Contact Support</Link></li>
                        <li><Link href="/privacy" className="text-slate-600 hover:text-sky-600 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="text-slate-600 hover:text-sky-600 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">
                © 2026 Filevera. All rights reserved.
            </div>
        </footer>
    );
}