"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Directory" },
    { href: "/chat", label: "Chat" },
    { href: "/join", label: "Apply" },
  ];

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
          </div>
        )}
      </div>
    </nav>
  );
}
