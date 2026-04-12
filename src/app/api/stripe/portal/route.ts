import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: contact } = await supabase
      .from("contacts")
      .select("stripe_customer_id")
      .eq("email", email)
      .single();

    if (!contact?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    const session = await stripe.billingPortal.sessions.create({
      customer: contact.stripe_customer_id,
      return_url: `${origin}/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Portal error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
