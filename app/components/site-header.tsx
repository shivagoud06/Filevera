"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/app/auth-client";
import { toolCategories, toolsInCategory } from "@/lib/tools";
import ProfileDropdown from "./profile-dropdown";
import MegaMenu, { MEGA_MENU_CATEGORIES } from "./mega-menu";

export default function SiteHeader() {
  const { data: session } = authClient.useSession();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeCategories = toolCategories.filter((category) => toolsInCategory(category).length > 0);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3 relative">
        {/* Brand Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-sky-500">
          File<span className="text-slate-900">vera</span>
        </Link>

        {/* Desktop Navigation Bar */}
        <nav aria-label="Main Navigation" className="hidden flex-wrap items-center gap-1 text-sm font-medium text-slate-600 md:flex">
          {activeCategories.map((category) => (
            <Link
              key={category}
              href={`/#${category.toLowerCase()}`}
              className="rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {category}
            </Link>
          ))}

          {/* All Tools Mega Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              aria-expanded={megaMenuOpen}
              aria-haspopup="true"
              className={`rounded-lg px-2.5 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 flex items-center gap-1.5 ${
                megaMenuOpen ? "bg-slate-100 text-sky-600 font-bold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>All tools</span>
              <svg
                className={`h-3.5 w-3.5 text-slate-400 transition-transform ${megaMenuOpen ? "rotate-180 text-sky-600" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Desktop Mega Menu Dropdown */}
            <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />
          </div>

          <Link
            href="/pricing"
            className="rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Pricing
          </Link>

          {session ? (
            <div className="ml-2 pl-2 border-l border-slate-200">
              <ProfileDropdown user={session.user} />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="ml-1.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
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

        {/* Mobile Header Right */}
        <div className="flex items-center gap-2 md:hidden">
          {session && <ProfileDropdown user={session.user} />}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
            className="flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          >
            {mobileMenuOpen ? "✕ Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-xl max-h-[calc(100vh-60px)] overflow-y-auto animate-fade-in">
          <div className="space-y-4 text-xs sm:text-sm font-medium">
            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/#pdf"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-sky-50 p-2.5 font-bold text-sky-800"
              >
                PDF Tools
              </Link>
              <Link
                href="/#images"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-purple-50 p-2.5 font-bold text-purple-800"
              >
                Image Tools
              </Link>
            </div>

            {/* Categorized Tools List for Mobile */}
            <div className="space-y-3 pt-2">
              {MEGA_MENU_CATEGORIES.map((category) => (
                <div key={category.title} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 pb-1.5">
                    {category.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    {category.items.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                          tool.available
                            ? "text-slate-800 hover:bg-white hover:text-sky-600"
                            : "text-slate-400 opacity-60 pointer-events-none"
                        }`}
                      >
                        <span className="font-semibold text-xs">{tool.name}</span>
                        {tool.tag && (
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${tool.tagColor}`}>
                            {tool.tag}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="my-2 border-t border-slate-100" />

            {/* Account & Pricing */}
            <div className="space-y-1">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Account & Pricing</p>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-800 hover:bg-slate-50 font-semibold"
              >
                <span>Plans & Pricing</span>
                <span className="text-slate-400">→</span>
              </Link>

              {session ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/usage"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Usage & Credits
                  </Link>
                  <Link
                    href="/account/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void authClient.signOut().then(() => window.location.reload());
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-red-600 hover:bg-red-50 font-semibold"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-10 items-center justify-center rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-10 items-center justify-center rounded-xl bg-sky-500 text-xs font-bold text-white hover:bg-sky-600 shadow-2xs"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            <div className="my-2 border-t border-slate-100" />

            {/* Legal / Help */}
            <div className="flex items-center justify-around text-xs text-slate-500 pt-1">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                Contact
              </Link>
              <span>•</span>
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                Terms
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}