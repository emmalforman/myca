import { createClient } from "@supabase/supabase-js";
import { getTier, TRIAL_DAYS } from "./tiers";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface MemberAccess {
  contactId: string;
  email: string;
  tier: string | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isPaid: boolean;        // has active subscription (member or founding)
  isTrialing: boolean;    // on a paid trial
  isFree: boolean;        // accepted member with no subscription
  isFounding: boolean;    // founding tier specifically
  trialDaysLeft: number;
  canBrowseDirectory: boolean;  // all accepted members
  canAccessChat: boolean;       // paid only
  canAccessEvents: boolean;     // paid only (free sees count only)
  canAccessJobs: boolean;       // paid only (free sees titles only)
  canSendIntro: boolean;
  canPostEvents: boolean;       // founding only
  canPostJobs: boolean;         // founding only
  introsUsed: number;
  introsLimit: number | null;   // null = unlimited
  introsRemaining: number | null;
}

// Free members get 2 intros total (lifetime), not per month
const FREE_INTRO_LIMIT = 2;

export async function getMemberAccess(email: string): Promise<MemberAccess | null> {
  const supabase = getSupabaseAdmin();

  const { data: contact } = await supabase
    .from("contacts")
    .select("contact_id,email,tier,subscription_status,trial_ends_at,current_period_end,billing_interval")
    .eq("email", email)
    .single();

  if (!contact) return null;

  const now = new Date();
  const trialEnd = contact.trial_ends_at ? new Date(contact.trial_ends_at) : null;
  const periodEnd = contact.current_period_end ? new Date(contact.current_period_end) : null;

  const isTrialing = contact.subscription_status === "trialing" && trialEnd !== null && trialEnd > now;
  const isActive = contact.subscription_status === "active" && periodEnd !== null && periodEnd > now;
  const isPaid = isTrialing || isActive;
  const isFree = !isPaid;
  const isFounding = isPaid && contact.tier === "founding";

  const trialDaysLeft = isTrialing && trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Count intros: for paid members, count this month; for free members, count all time
  let introsUsed = 0;
  if (isFree) {
    // Free: count all-time intros
    const { count } = await supabase
      .from("introductions")
      .select("*", { count: "exact", head: true })
      .eq("person_a_id", contact.contact_id);
    introsUsed = count || 0;
  } else {
    // Paid: count this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await supabase
      .from("introductions")
      .select("*", { count: "exact", head: true })
      .eq("person_a_id", contact.contact_id)
      .gte("created_at", monthStart);
    introsUsed = count || 0;
  }

  const tierConfig = getTier(contact.tier);
  const introsLimit = isFree
    ? FREE_INTRO_LIMIT
    : tierConfig?.introsPerMonth ?? 5;
  const introsRemaining = introsLimit === null ? null : Math.max(0, introsLimit - introsUsed);
  const canSendIntro = introsRemaining === null || introsRemaining > 0;

  return {
    contactId: contact.contact_id,
    email: contact.email,
    tier: contact.tier,
    subscriptionStatus: contact.subscription_status,
    trialEndsAt: contact.trial_ends_at,
    currentPeriodEnd: contact.current_period_end,
    isPaid,
    isTrialing,
    isFree,
    isFounding,
    trialDaysLeft,
    canBrowseDirectory: true,       // all accepted members
    canAccessChat: isPaid,
    canAccessEvents: isPaid,
    canAccessJobs: isPaid,
    canSendIntro,
    canPostEvents: isFounding,
    canPostJobs: isFounding,
    introsUsed,
    introsLimit,
    introsRemaining,
  };
}

export async function startTrial(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const { error } = await supabase
    .from("contacts")
    .update({
      tier: "member",
      subscription_status: "trialing",
      trial_ends_at: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
    })
    .eq("email", email);

  return !error;
}
