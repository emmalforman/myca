"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function WelcomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  const handleStartTrial = async () => {
    if (!email) return;
    setStarting(true);

    await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    window.location.href = "/directory";
  };

  const handlePayNow = async (tier: "member" | "founding") => {
    if (!email) return;
    setCheckoutLoading(tier);

    // Use yearly price as default for pay-now (best value)
    const priceEnvKey = tier === "founding"
      ? "NEXT_PUBLIC_STRIPE_PRICE_FOUNDING_YEARLY"
      : "NEXT_PUBLIC_STRIPE_PRICE_MEMBER_YEARLY";
    const priceId = process.env[priceEnvKey] || priceEnvKey;

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, email, skipTrial: true }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setCheckoutLoading(null);
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mb-10">
          <div className="w-16 h-16 bg-forest-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-600 font-mono mb-3">
            You&apos;re in
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-ink-900 mb-3">
            Welcome to Myca
          </h1>
          <p className="text-[15px] text-ink-400 max-w-md mx-auto">
            You&apos;ve been accepted into the collective. Choose how you&apos;d like to get started.
          </p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          {/* Start trial */}
          <button
            onClick={handleStartTrial}
            disabled={starting || !email}
            className="w-full p-5 text-left bg-white border border-ink-200 hover:border-forest-400 transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink-900">
                  Start 14-day free trial
                </p>
                <p className="text-[13px] text-ink-400 mt-0.5">
                  Explore the directory, send intros, RSVP to events
                </p>
              </div>
              <svg className="w-5 h-5 text-ink-300 group-hover:text-forest-600 transition-colors flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-ivory px-3 text-[11px] uppercase tracking-wider text-ink-300 font-mono">
                or choose a plan now
              </span>
            </div>
          </div>

          {/* Pay now — Member */}
          <button
            onClick={() => handlePayNow("member")}
            disabled={checkoutLoading === "member" || !email}
            className="w-full p-5 text-left bg-white border border-ink-200 hover:border-forest-400 transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink-900">
                  Member — $240/yr
                </p>
                <p className="text-[13px] text-ink-400 mt-0.5">
                  5 intros/mo, all events, full directory
                </p>
              </div>
              <svg className="w-5 h-5 text-ink-300 group-hover:text-forest-600 transition-colors flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Pay now — Founding */}
          <button
            onClick={() => handlePayNow("founding")}
            disabled={checkoutLoading === "founding" || !email}
            className="w-full p-5 text-left bg-forest-900 border border-forest-800 hover:bg-forest-800 transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-cream">
                  Founding Member — $480/yr
                </p>
                <p className="text-[13px] text-forest-300 mt-0.5">
                  Unlimited intros, host events, guest passes
                </p>
              </div>
              <svg className="w-5 h-5 text-forest-400 group-hover:text-cream transition-colors flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <p className="text-[12px] text-ink-300 mt-8">
          Questions?{" "}
          <Link href="/pricing" className="text-forest-600 underline">
            Compare plans
          </Link>
        </p>
      </div>
    </div>
  );
}
