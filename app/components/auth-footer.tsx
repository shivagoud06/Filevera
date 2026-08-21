import Link from "next/link";

export default function AuthFooter() {
    return <footer className="auth-footer border-t border-slate-800 bg-slate-900 px-5 py-4 text-center text-xs text-slate-400"><nav aria-label="Authentication footer" className="flex items-center justify-center gap-3"><Link href="/privacy" className="text-slate-400 hover:text-sky-400 hover:underline">Privacy</Link><span aria-hidden="true">·</span><Link href="/terms" className="text-slate-400 hover:text-sky-400 hover:underline">Terms</Link><span aria-hidden="true">·</span><Link href="/contact" className="text-slate-400 hover:text-sky-400 hover:underline">Contact</Link></nav><p className="mt-2">© {new Date().getFullYear()} Filevera. All rights reserved.</p></footer>;
}
