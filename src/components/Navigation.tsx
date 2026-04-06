"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/join", label: "Apply" },
  ];

  const memberLinks = [
    { href: "/directory", label: "Directory" },
    { href: "/chat", label: "Chat" },
  ];

  const links = signedIn
    ? [
        { href: "/", label: "Home" },
        { href: "/directory", label: "Directory" },
        { href: "/chat", label: "Chat" },
        { href: "/join", label: "Apply" },
      ]
    : publicLinks;

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    setSignedIn(false);
    window.location.href = "/";
  };

  return (
    <nav className="bg-ivory/90 backdrop-blur-lg border-b border-ink-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-serif tracking-tight text-ink-900">
              myca
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono hidden sm:inline">
              collective
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 text-[13px] tracking-wide uppercase transition-colors ${
                  pathname === link.href
                    ? "text-ink-900 font-medium"
                    : "text-ink-400 hover:text-ink-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {signedIn ? (
              <button
                onClick={handleSignOut}
                className="ml-2 px-4 py-1.5 text-[13px] tracking-wide uppercase text-ink-400 hover:text-ink-700 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/directory"
                className="ml-2 px-5 py-1.5 text-[12px] tracking-wide uppercase font-medium text-white bg-ink-900 hover:bg-ink-700 transition-colors"
              >
                Log In
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-ink-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="sm:hidden pb-4 space-y-1 border-t border-ink-100 pt-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm tracking-wide uppercase ${
                  pathname === link.href
                    ? "text-ink-900 font-medium"
                    : "text-ink-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {signedIn ? (
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm tracking-wide uppercase text-ink-400"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/directory"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm tracking-wide uppercase text-ink-900 font-medium"
              >
                Log In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
