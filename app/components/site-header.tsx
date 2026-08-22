"use client";

import Link from "next/link";
import { authClient } from "@/app/auth-client";
import { toolsInCategory, toolCategories } from "@/lib/tools";

export default function SiteHeader() {
    const { data: session } = authClient.useSession();
    const activeCategories = toolCategories.filter((category) => toolsInCategory(category).length > 0);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
                <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-sky-500">
                    File<span className="text-slate-900">vera</span>
                </Link>
                <nav aria-label="Tool categories" className="hidden flex-wrap items-center gap-1 text-sm font-medium text-slate-600 md:flex">
                    {activeCategories.map((category) => (
                        <Link
                            key={category}
                            href={`/#${category.toLowerCase()}`}
                            className="rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            {category}
                        </Link>
                    ))}
                    <details className="relative group">
                        <summary className="cursor-pointer list-none rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 flex items-center gap-1">
                            <span>All tools</span>
                            <span className="text-xs text-slate-400">▾</span>
                        </summary>
                        <div className="absolute right-0 z-20 mt-1.5 grid w-64 gap-1 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg">
                            {activeCategories.map((category) => (
                                <div key={category}>
                                    <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{category} tools</p>
                                    {toolsInCategory(category).map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className="block rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                                        >
                                            {tool.title}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </details>
                    {session ? (
                        <>
                            <Link href="/account" className="ml-1.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors">Account</Link>
                            <button
                                type="button"
                                onClick={() => void authClient.signOut().then(() => window.location.reload())}
                                className="rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="ml-1.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500">
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className="ml-1 rounded-lg bg-sky-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
                <details className="relative md:hidden">
                    <summary className="flex h-9 cursor-pointer items-center justify-center list-none rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs">
                        Menu
                    </summary>
                    <nav aria-label="Mobile navigation" className="absolute right-0 z-50 mt-2 w-[calc(100vw-32px)] max-w-xs rounded-2xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium shadow-xl">
                        <div className="space-y-1">
                            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tools</p>
                            <Link href="/#pdf" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-800 hover:bg-slate-50">
                                <span>PDF Tools</span>
                                <span className="text-slate-400">→</span>
                            </Link>
                            <Link href="/#images" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-800 hover:bg-slate-50">
                                <span>Image Tools</span>
                                <span className="text-slate-400">→</span>
                            </Link>
                        </div>
                        <div className="my-2 border-t border-slate-100" />
                        <div className="space-y-1">
                            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Account</p>
                            {session ? (
                                <>
                                    <Link href="/account" className="block rounded-xl px-3 py-2.5 text-slate-800 hover:bg-slate-50">Account Settings</Link>
                                    <button
                                        type="button"
                                        onClick={() => void authClient.signOut().then(() => window.location.reload())}
                                        className="w-full text-left rounded-xl px-3 py-2.5 text-red-600 hover:bg-red-50"
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Link href="/login" className="flex h-10 items-center justify-center rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                                        Log in
                                    </Link>
                                    <Link href="/signup" className="flex h-10 items-center justify-center rounded-xl bg-sky-500 text-xs font-bold text-white hover:bg-sky-600 shadow-2xs">
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="my-2 border-t border-slate-100" />
                        <div className="flex items-center justify-around text-xs text-slate-500 pt-1">
                            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
                            <span>•</span>
                            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
                            <span>•</span>
                            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
                        </div>
                    </nav>
                </details>
            </div>
        </header>
    );
}