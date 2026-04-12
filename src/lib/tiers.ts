export type TierSlug = "member" | "founding";

export interface TierConfig {
  slug: TierSlug;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceMonthly: string;
  stripePriceYearly: string;
  introsPerMonth: number | null; // null = unlimited
  features: string[];
  highlighted?: boolean;
}

export const TIERS: TierConfig[] = [
  {
    slug: "member",
    name: "Member",
    tagline: "Full access to the network",
    monthlyPrice: 25,
    yearlyPrice: 240,
    stripePriceMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEMBER_MONTHLY || "",
    stripePriceYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEMBER_YEARLY || "",
    introsPerMonth: 5,
    features: [
      "Full member directory",
      "5 intro requests per month",
      "Attend all members-only events",
      "Community channels & DMs",
    ],
  },
  {
    slug: "founding",
    name: "Founding Member",
    tagline: "For the most active members",
    monthlyPrice: 50,
    yearlyPrice: 480,
    stripePriceMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDING_MONTHLY || "",
    stripePriceYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDING_YEARLY || "",
    introsPerMonth: null,
    features: [
      "Full member directory",
      "Unlimited intro requests",
      "Attend all members-only events",
      "Early RSVP + 2 guest passes per year",
      "Host & propose events",
      "Community channels & DMs",
    ],
    highlighted: true,
  },
];

export const TRIAL_DAYS = 14;

export function getTier(slug: string | null | undefined): TierConfig | undefined {
  return TIERS.find((t) => t.slug === slug);
}

export function getTierByPriceId(priceId: string): { tier: TierConfig; interval: "month" | "year" } | undefined {
  for (const tier of TIERS) {
    if (tier.stripePriceMonthly === priceId) return { tier, interval: "month" };
    if (tier.stripePriceYearly === priceId) return { tier, interval: "year" };
  }
  return undefined;
}
