"use client";

import Link from "next/link";
import { authClient } from "@/app/auth-client";
import { toolsInCategory, toolCategories } from "@/lib/tools";

export default function SiteHeader() {
    const { data: session } = authClient.useSession();
    const activeCategories = toolCategories.filter((category) => toolsInCategory(category).length > 0);
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
                <Link href="/" className="text-2xl font-black tracking-tight text-sky-500">File<span className="text-slate-900">vera</span></Link>
                <nav aria-label="Tool categories" className="hidden flex-wrap items-center gap-1 text-sm font-medium text-slate-600 md:flex">
                    {activeCategories.map((category) => (
                        <Link key={category} href={`/#${category.toLowerCase()}`} className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">{category}</Link>
                    ))}
                    <details className="relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">All tools</summary><div className="absolute right-0 z-10 mt-2 grid w-64 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">{activeCategories.map((category) => <div key={category}><p className="px-2 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-slate-500">{category} tools</p>{toolsInCategory(category).map((tool) => <Link key={tool.href} href={tool.href} className="block rounded-lg px-2 py-2 hover:bg-slate-50 hover:text-blue-700">{tool.title}</Link>)}</div>)}</div></details>
                    {session ? <><Link href="/account" className="ml-2 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-700">Account</Link><button type="button" onClick={() => void authClient.signOut().then(() => window.location.reload())} className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-700">Log out</button></> : <><Link href="/login" className="ml-2 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Log in</Link><Link href="/signup" className="rounded-lg bg-blue-700 px-3 py-2 text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500">Sign up</Link></>}
                </nav>
                <details className="relative md:hidden"><summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">Menu</summary><nav aria-label="Mobile navigation" className="absolute right-0 z-10 mt-2 grid min-w-52 gap-1 rounded-xl border border-slate-200 bg-white p-2 text-sm font-medium shadow-lg">{activeCategories.map((category) => <Link key={category} href={`/#${category.toLowerCase()}`} className="rounded-lg px-3 py-2 hover:bg-slate-50">{category} tools</Link>)}{session ? <Link href="/account" className="rounded-lg px-3 py-2 hover:bg-slate-50">Account</Link> : <><Link href="/login" className="rounded-lg px-3 py-2 hover:bg-slate-50">Log in</Link><Link href="/signup" className="rounded-lg bg-blue-700 px-3 py-2 text-white">Sign up</Link></>}<Link href="/privacy" className="rounded-lg px-3 py-2 hover:bg-slate-50">Privacy</Link><Link href="/terms" className="rounded-lg px-3 py-2 hover:bg-slate-50">Terms</Link><Link href="/contact" className="rounded-lg px-3 py-2 hover:bg-slate-50">Contact</Link></nav></details>
            </div>
        </header>
    );
}