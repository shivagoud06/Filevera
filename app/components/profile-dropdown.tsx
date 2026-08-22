"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/app/auth-client";
import ProfileAvatar from "./profile-avatar";

interface UserCreditsData {
  plan: string;
  planName: string;
  credits: number;
  creditsResetAt: number;
  subscriptionStatus: string;
}

interface ProfileDropdownProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [creditsData, setCreditsData] = useState<UserCreditsData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch real user credits & plan status
  useEffect(() => {
    let mounted = true;
    fetch("/api/user/credits")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) {
          setCreditsData(data);
        }
      })
      .catch(() => {
        // Silently keep default
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle outside clicks and Escape key to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await authClient.signOut();
    window.location.reload();
  };

  const credits = creditsData ? creditsData.credits : 100;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        <ProfileAvatar name={user.name} email={user.email} image={user.image} size="md" />
        <span className="hidden text-xs font-semibold text-slate-700 sm:inline-block max-w-[100px] truncate">
          {user.name || user.email?.split("@")[0]}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-24px)] origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl focus:outline-none"
        >
          {/* Header Info */}
          <div className="border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <ProfileAvatar name={user.name} email={user.email} image={user.image} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{user.name || "Filevera User"}</p>
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              </div>
            </div>

            {/* Plan & Credits Badges */}
            <div className="mt-2.5 flex items-center justify-between gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  creditsData?.plan === "pro_plus"
                    ? "bg-purple-600"
                    : creditsData?.plan === "pro"
                    ? "bg-sky-500"
                    : "bg-emerald-500"
                }`} />
                <span>
                  {creditsData?.plan === "pro_plus"
                    ? "PRO PLUS"
                    : creditsData?.plan === "pro"
                    ? "PRO PLAN"
                    : "FREE PLAN"}
                </span>
              </div>
              <div className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                {credits.toLocaleString()} credits
              </div>
            </div>
          </div>

          {/* Menu Links */}
          <div className="space-y-0.5 py-1.5 text-xs font-medium text-slate-700">
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-sky-600 transition-colors"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>My Account</span>
            </Link>

            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-sky-600 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0v10.5m0-10.5h.75a.75.75 0 0 1 .75.75v.75m0 0h12m-12 0H3m16.5 0h.75a.75.75 0 0 1 .75.75v.75m0 0v10.5m0-10.5h-.75a.75.75 0 0 0-.75.75v.75m0 0h-12" />
                </svg>
                <span>Plans & Pricing</span>
              </div>
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">Upgrade</span>
            </Link>

            <Link
              href="/account#usage"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-sky-600 transition-colors"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span>Usage & Credits</span>
            </Link>

            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-sky-600 transition-colors"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              <span>Support & Help</span>
            </Link>

            <Link
              href="/feedback"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-sky-600 transition-colors"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <span>Reviews & Feedback</span>
            </Link>

            <Link
              href="/account#settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-sky-600 transition-colors"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span>Settings</span>
            </Link>
          </div>

          {/* Logout button */}
          <div className="border-t border-slate-100 pt-1.5">
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
