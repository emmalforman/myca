"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchUnread = useCallback((email: string) => {
    fetch(`/api/unread?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => setHasUnread((data.count || 0) > 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        fetchUnread(session.user.email);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        fetchUnread(session.user.email);
      } else {
        setUserEmail(null);
        setHasUnread(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchUnread]);

  // Subscribe to new messages so the badge updates live
  useEffect(() => {
    if (!userEmail) return;

    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel("nav-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          // Only count messages from other people
          if (payload.new?.sender_email !== userEmail) {
            // If we're currently on the chat page, the chat component
            // handles marking as read — skip bumping the badge
            if (window.location.pathname !== "/chat") {
              setHasUnread(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  // Clear the badge when the user navigates to /chat
  useEffect(() => {
    if (pathname === "/chat" && userEmail) {
      // Small delay to let the chat page mark channels as read
      const timer = setTimeout(() => fetchUnread(userEmail), 2000);
      return () => clearTimeout(timer);
    }
  }, [pathname, userEmail, fetchUnread]);

  const handleSignOut = async () => {
    await getSupabaseBrowser().auth.signOut();
    setSignedIn(false);
    setUserEmail(null);
    setHasUnread(false);
    window.location.href = "/";
  };

  const links = signedIn
    ? [
        { href: "/", label: "Home" },
        { href: "/directory", label: "Directory" },
        { href: "/chat", label: "Chat" },
        { href: "/profile", label: "Profile" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/join", label: "Apply" },
      ];

  const UnreadDot = () =>
    hasUnread ? (
      <span className="ml-1 inline-block w-1.5 h-1.5 bg-clay-400 rounded-full" />
    ) : null;

  return (
    <nav className="bg-forest-900 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-serif text-cream tracking-tight">
              Myca
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 text-[13px] tracking-wide uppercase transition-colors flex items-center ${
                  pathname === link.href
                    ? "text-cream font-medium"
                    : "text-forest-300 hover:text-cream"
                }`}
              >
                {link.label}
                {link.href === "/chat" && <UnreadDot />}
              </Link>
            ))}
            {signedIn ? (
              <button
                onClick={handleSignOut}
                className="ml-2 px-4 py-1.5 text-[13px] tracking-wide uppercase text-forest-400 hover:text-cream transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/directory"
                className="ml-2 px-5 py-1.5 text-[12px] tracking-wide uppercase font-medium text-forest-900 bg-cream hover:bg-white transition-colors"
              >
                Log In
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-cream"
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
          <div className="sm:hidden pb-4 space-y-1 border-t border-forest-800 pt-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm tracking-wide uppercase ${
                  pathname === link.href
                    ? "text-cream font-medium"
                    : "text-forest-400"
                } ${link.href === "/chat" ? "flex items-center" : ""}`}
              >
                {link.label}
                {link.href === "/chat" && <UnreadDot />}
              </Link>
            ))}
            {signedIn ? (
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm tracking-wide uppercase text-forest-400"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/directory"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm tracking-wide uppercase text-cream font-medium"
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
