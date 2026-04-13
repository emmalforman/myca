"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // Hide footer on chat page — it's a fixed-height layout that shouldn't overflow
  if (pathname === "/chat") return null;

  return (
    <footer className="bg-forest-950 text-forest-400">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <p className="text-2xl font-serif text-cream mb-3">Myca</p>
            <p className="text-sm leading-relaxed max-w-sm text-forest-400">
              A curated community connecting founders, operators, and investors
              across the food and consumer goods industry.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-forest-600 mb-4">
              Navigate
            </p>
            <div className="space-y-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/directory", label: "Directory" },
                { href: "/chat", label: "Chat" },
                { href: "/join", label: "Apply" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-forest-400 hover:text-cream transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-forest-600 mb-4">
              Connect
            </p>
            <div className="space-y-2.5 text-sm">
              <p>New York &middot; San Francisco</p>
              <p>Los Angeles &middot; London &middot; Chicago</p>
              <a
                href="https://www.instagram.com/myca_collective"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-forest-400 hover:text-cream transition-colors mt-3"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                @myca_collective
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-forest-800 mt-14 pt-8 flex items-center justify-between">
          <p className="text-xs text-forest-700">
            &copy; {new Date().getFullYear()} Myca Collective
          </p>
          <p className="text-xs text-forest-700 font-mono">
            By invitation & application
          </p>
        </div>
      </div>
    </footer>
  );
}
