import Link from "next/link";

export default function SiteFooter() {
    return (
        <footer className="mt-auto border-t border-slate-200/80 bg-white text-slate-600">
            {/* Main Multi-Column Section */}
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 lg:grid-cols-6 sm:px-6 sm:py-12">
                {/* Left Brand Area */}
                <div className="sm:col-span-2 lg:col-span-2">
                    <Link href="/" className="text-xl font-black tracking-tight text-sky-500">
                        File<span className="text-slate-900">vera</span>
                    </Link>
                    <p className="mt-2.5 max-w-xs text-xs leading-5 text-slate-500">
                        Simple tools for every file. Fast, secure, and private.
                    </p>
                    <p className="mt-4 text-xs text-slate-400">
                        © 2026 Filevera. All rights reserved.
                    </p>
                </div>

                {/* Column 1: PRODUCT */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product</h3>
                    <ul className="mt-3 space-y-2 text-xs">
                        <li><Link href="/compress-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">Compress PDF</Link></li>
                        <li><Link href="/merge-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">Merge PDF</Link></li>
                        <li><Link href="/split-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">Split PDF</Link></li>
                        <li><Link href="/jpg-to-pdf" className="text-slate-600 hover:text-sky-600 transition-colors">JPG to PDF</Link></li>
                        <li><Link href="/pdf-to-jpg" className="text-slate-600 hover:text-sky-600 transition-colors">PDF to JPG</Link></li>
                        <li><Link href="/pricing" className="text-slate-600 hover:text-sky-600 transition-colors font-semibold">Plans & Pricing</Link></li>
                    </ul>
                </div>

                {/* Column 2: IMAGES */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Images</h3>
                    <ul className="mt-3 space-y-2 text-xs">
                        <li><Link href="/image-compressor" className="text-slate-600 hover:text-sky-600 transition-colors">Compress Image</Link></li>
                        <li><Link href="/image-resizer" className="text-slate-600 hover:text-sky-600 transition-colors">Resize Image</Link></li>
                        <li><Link href="/compress-image-to-50kb" className="text-slate-600 hover:text-sky-600 transition-colors">Compress to 50KB</Link></li>
                        <li><Link href="/compress-image-to-100kb" className="text-slate-600 hover:text-sky-600 transition-colors">Compress to 100KB</Link></li>
                    </ul>
                </div>

                {/* Column 3: SUPPORT & COMMUNITY */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Support & Community</h3>
                    <ul className="mt-3 space-y-2 text-xs">
                        <li><Link href="/support" className="text-slate-600 hover:text-sky-600 transition-colors">Customer Support</Link></li>
                        <li><Link href="/contact" className="text-slate-600 hover:text-sky-600 transition-colors">Contact</Link></li>
                        <li><Link href="/#faq" className="text-slate-600 hover:text-sky-600 transition-colors">FAQ</Link></li>
                        <li><Link href="/feedback" className="text-slate-600 hover:text-sky-600 transition-colors">Reviews & Feedback</Link></li>
                        <li><Link href="/privacy" className="text-slate-600 hover:text-sky-600 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="text-slate-600 hover:text-sky-600 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                {/* Column 4: COMPANY */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Company</h3>
                    <ul className="mt-3 space-y-2 text-xs">
                        <li><Link href="/#faq" className="text-slate-600 hover:text-sky-600 transition-colors">About Filevera</Link></li>
                        <li><Link href="/support" className="text-slate-600 hover:text-sky-600 transition-colors">Help</Link></li>
                        <li><Link href="/contact" className="text-slate-600 hover:text-sky-600 transition-colors">Contact</Link></li>
                        <li><Link href="/privacy" className="text-slate-600 hover:text-sky-600 transition-colors">Security</Link></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="border-t border-slate-100 bg-slate-50/50">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6">
                    <p>© 2026 Filevera. All rights reserved.</p>

                    <div className="flex items-center gap-5">
                        <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-slate-900 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/contact" className="hover:text-slate-900 transition-colors">
                            Contact
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}