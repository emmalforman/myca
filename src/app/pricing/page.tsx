"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

const FREE_FEATURES = [
  "Browse the full member directory",
  "2 intro requests (total)",
];

const FREE_LOCKED = [
  "Community chat channels & DMs",
  "Events calendar & RSVP",
  "Job board",
  "Substack content",
  "Partner perks & deals",
];

const PAID_TIERS = [
  {
    slug: "member",
    name: "Member",
    tagline: "Full access to the network",
    monthlyPrice: 25,
    yearlyPrice: 240,
    features: [
      "Full member directory + badge",
      "5 intro requests per month",
      "Community chat channels & DMs",
      "Events calendar & RSVP",
      "Job board access",
      "Substack content",
      "Partner perks & deals",
    ],
  },
  {
    slug: "founding",
    name: "Founding Member",
    tagline: "For the most active members",
    monthlyPrice: 50,
    yearlyPrice: 480,
    features: [
      "Full member directory + priority placement",
      "Unlimited intro requests",
      "Community chat channels & DMs",
      "Events calendar & RSVP + early access",
      "Job board access + post listings",
      "Substack content",
      "Partner perks & deals",
      "Host & propose events",
      "2 guest passes per year",
    ],
    highlighted: true,
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  const handleCheckout = async (tierSlug: string) => {
    if (!email) {
      window.location.href = "/directory";
      return;
    }

    setLoading(tierSlug);

    const tier = PAID_TIERS.find((t) => t.slug === tierSlug);
    if (!tier) return;

    const priceEnvKey = interval === "month"
      ? `NEXT_PUBLIC_STRIPE_PRICE_${tierSlug.toUpperCase()}_MONTHLY`
      : `NEXT_PUBLIC_STRIPE_PRICE_${tierSlug.toUpperCase()}_YEARLY`;
    const priceId = process.env[priceEnvKey] || priceEnvKey;

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, email, skipTrial: false }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-forest-900">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-4">
            Membership
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-3">
            Join the Collective
          </h1>
          <p className="text-[15px] text-forest-300 max-w-lg mx-auto">
            Connect with 250+ founders, operators, and investors in food & CPG.
            Join for free. Upgrade to unlock the full network.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 -mt-6">
        {/* Interval toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white border border-ink-200 p-1">
            <button
              onClick={() => setInterval("month")}
              className={`px-5 py-2 text-[13px] font-medium transition-colors ${
                interval === "month"
                  ? "bg-forest-900 text-cream"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("year")}
              className={`px-5 py-2 text-[13px] font-medium transition-colors ${
                interval === "year"
                  ? "bg-forest-900 text-cream"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Tier cards — 3 columns */}
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {/* Free tier */}
          <div className="bg-white border border-ink-200 p-7">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-1">
              Free
            </p>
            <p className="text-[13px] text-ink-400 mb-5">See what you&apos;re missing</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-serif text-ink-900">$0</span>
              </div>
              <p className="text-[12px] text-ink-400 mt-1">Forever</p>
            </div>

            <Link
              href="/join"
              className="block w-full py-3 text-[12px] uppercase tracking-wider font-medium text-center text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors mb-6"
            >
              Apply to Join
            </Link>

            <div className="border-t border-ink-100 pt-5">
              <ul className="space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[13px] text-ink-600">{f}</span>
                  </li>
                ))}
                {FREE_LOCKED.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 opacity-40">
                    <svg className="w-4 h-4 text-ink-300 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[13px] text-ink-400">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Paid tiers */}
          {PAID_TIERS.map((tier) => {
            const price = interval === "month" ? tier.monthlyPrice : tier.yearlyPrice;
            const monthlyEquivalent = interval === "year" ? Math.round(tier.yearlyPrice / 12) : null;
            const savings = interval === "year" ? tier.monthlyPrice * 12 - tier.yearlyPrice : 0;

            return (
              <div
                key={tier.slug}
                className={`bg-white border ${
                  tier.highlighted
                    ? "border-forest-400 ring-1 ring-forest-200"
                    : "border-ink-200"
                } p-7 relative`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 text-[10px] uppercase tracking-wider font-medium bg-forest-900 text-cream">
                      Most Popular
                    </span>
                  </div>
                )}

                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-1">
                  {tier.name}
                </p>
                <p className="text-[13px] text-ink-400 mb-5">{tier.tagline}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif text-ink-900">
                      ${price}
                    </span>
                    <span className="text-[13px] text-ink-400">
                      /{interval === "month" ? "mo" : "yr"}
                    </span>
                  </div>
                  {monthlyEquivalent !== null && (
                    <p className="text-[12px] text-forest-600 mt-1">
                      ${monthlyEquivalent}/mo &middot; save ${savings}/yr
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCheckout(tier.slug)}
                  disabled={loading === tier.slug}
                  className={`w-full py-3 text-[12px] uppercase tracking-wider font-medium transition-colors mb-6 ${
                    tier.highlighted
                      ? "bg-forest-900 text-cream hover:bg-forest-700"
                      : "bg-ink-900 text-cream hover:bg-ink-700"
                  } disabled:opacity-50`}
                >
                  {loading === tier.slug ? "..." : "Start Free Trial"}
                </button>

                <div className="border-t border-ink-100 pt-5">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <svg
                          className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-[13px] text-ink-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fine print */}
        <div className="max-w-xl mx-auto text-center py-16">
          <p className="text-[13px] text-ink-400 mb-2">
            All paid plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-[13px] text-ink-300">
            Already a member?{" "}
            <Link href="/directory" className="text-forest-600 underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
