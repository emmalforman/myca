import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { getTierByPriceId } from "@/lib/tiers";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function updateSubscription(subscription: Stripe.Subscription) {
  const supabase = getSupabaseAdmin();
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const item = subscription.items.data[0];
  const priceId = item?.price?.id;
  const tierInfo = priceId ? getTierByPriceId(priceId) : undefined;

  // In Stripe v22+, current_period_end is on the item, not the subscription
  const periodEnd = item?.current_period_end;

  const updates: Record<string, any> = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    billing_interval: tierInfo?.interval || item?.price?.recurring?.interval || null,
  };

  if (periodEnd) {
    updates.current_period_end = new Date(periodEnd * 1000).toISOString();
  }

  if (tierInfo) {
    updates.tier = tierInfo.tier.slug;
  }

  if (subscription.status === "trialing" && subscription.trial_end) {
    updates.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
  }

  await supabase
    .from("contacts")
    .update(updates)
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id
        );
        await updateSubscription(subscription);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscription(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

      const supabase = getSupabaseAdmin();
      await supabase
        .from("contacts")
        .update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;

      if (customerId) {
        const supabase = getSupabaseAdmin();
        await supabase
          .from("contacts")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
