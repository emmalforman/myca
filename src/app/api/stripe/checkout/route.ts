import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { TRIAL_DAYS } from "@/lib/tiers";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { priceId, email, skipTrial } = await request.json();

    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing priceId or email" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Find or create Stripe customer
    const { data: contact } = await supabase
      .from("contacts")
      .select("contact_id,stripe_customer_id")
      .eq("email", email)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    let customerId = contact.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { contact_id: contact.contact_id },
      });
      customerId = customer.id;

      await supabase
        .from("contacts")
        .update({ stripe_customer_id: customerId })
        .eq("contact_id", contact.contact_id);
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/directory?payment=success`,
      cancel_url: `${origin}/pricing?payment=canceled`,
      subscription_data: skipTrial ? undefined : {
        trial_period_days: TRIAL_DAYS,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
