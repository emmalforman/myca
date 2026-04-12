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
  isActive: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  canBrowseDirectory: boolean;
  canSendIntro: boolean;
  introsUsedThisMonth: number;
  introsRemaining: number | null; // null = unlimited
}

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
  const hasAccess = isTrialing || isActive;

  const trialDaysLeft = isTrialing && trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Count intros sent this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("introductions")
    .select("*", { count: "exact", head: true })
    .eq("person_a_id", contact.contact_id)
    .gte("created_at", monthStart);

  const introsUsedThisMonth = count || 0;
  const tierConfig = getTier(contact.tier);
  const introsPerMonth = tierConfig?.introsPerMonth ?? 5;
  const introsRemaining = introsPerMonth === null ? null : Math.max(0, introsPerMonth - introsUsedThisMonth);
  const canSendIntro = hasAccess && (introsRemaining === null || introsRemaining > 0);

  return {
    contactId: contact.contact_id,
    email: contact.email,
    tier: contact.tier,
    subscriptionStatus: contact.subscription_status,
    trialEndsAt: contact.trial_ends_at,
    currentPeriodEnd: contact.current_period_end,
    isActive,
    isTrialing,
    trialDaysLeft,
    canBrowseDirectory: hasAccess,
    canSendIntro,
    introsUsedThisMonth,
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
