"use client";

import Link from "next/link";

export default function UpgradeGate({
  title,
  description,
  type,
}: {
  title?: string;
  description?: string;
  type?: "intros" | "directory" | "events" | "expired";
}) {
  const defaults = {
    intros: {
      title: "Intro limit reached",
      description: "You've used all your intro requests this month. Upgrade to Founding for unlimited intros.",
    },
    directory: {
      title: "Membership required",
      description: "Upgrade your membership to browse the full directory and connect with members.",
    },
    events: {
      title: "Members only",
      description: "This event is available to active members. Choose a plan to RSVP.",
    },
    expired: {
      title: "Trial ended",
      description: "Your 14-day trial has ended. Choose a plan to keep your access to the directory, events, and intros.",
    },
  };

  const d = type ? defaults[type] : null;

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-clay-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-clay-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-serif text-ink-900 mb-2">
          {title || d?.title || "Upgrade required"}
        </h2>
        <p className="text-[14px] text-ink-400 mb-6">
          {description || d?.description || "Choose a plan to continue."}
        </p>
        <Link
          href="/pricing"
          className="inline-block px-8 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}
