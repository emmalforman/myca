"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function TrialBanner() {
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isTrialing, setIsTrialing] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) return;

      const res = await fetch(`/api/access?email=${encodeURIComponent(session.user.email)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.isTrialing) {
        setIsTrialing(true);
        setTrialDaysLeft(data.trialDaysLeft);
      } else if (data.isFree) {
        setIsFree(true);
      }
    });
  }, []);

  if (dismissed) return null;
  if (!isTrialing && !isFree) return null;

  return (
    <div className="bg-forest-800 text-cream">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between py-2">
        {isTrialing ? (
          <p className="text-[12px]">
            <span className="font-mono uppercase tracking-wider text-forest-300">
              Trial
            </span>
            <span className="mx-2 text-forest-600">&middot;</span>
            <span>
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
            </span>
            <span className="mx-2 text-forest-600">&middot;</span>
            <Link href="/pricing" className="text-forest-200 underline hover:text-cream">
              Choose a plan
            </Link>
          </p>
        ) : (
          <p className="text-[12px]">
            <span className="font-mono uppercase tracking-wider text-forest-300">
              Free
            </span>
            <span className="mx-2 text-forest-600">&middot;</span>
            <span>
              Unlock chat, events, and more
            </span>
            <span className="mx-2 text-forest-600">&middot;</span>
            <Link href="/pricing" className="text-forest-200 underline hover:text-cream">
              Upgrade
            </Link>
          </p>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-forest-400 hover:text-cream transition-colors ml-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
