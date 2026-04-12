import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit by IP: 5 applications per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit({ name: "apply", max: 5, windowSeconds: 3600 }, ip);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const body = await request.json();

  // Honeypot: if the hidden field is filled, it's a bot
  if (body.website_url) {
    // Silently accept to not tip off the bot, but don't save
    return NextResponse.json({ success: true });
  }

  const {
    name,
    firstName,
    lastName,
    company,
    title,
    occupation,
    linkedin,
    instagram,
    website,
    email,
    phone,
    location,
    industryFocus,
    skills,
    yearsExperience,
    comfortFood,
    referralSource,
    referredByName,
    referredByEmail,
    hopingToGet,
    excitedToContribute,
    photoUrl,
  } = body;

  const fullName = name || `${firstName} ${lastName}`.trim();

  if (
    !fullName ||
    !company ||
    !title ||
    !occupation ||
    !email ||
    !linkedin ||
    !phone ||
    !comfortFood ||
    !hopingToGet ||
    !excitedToContribute
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from("applications").insert({
      full_name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      company,
      title,
      occupation,
      linkedin,
      instagram: instagram || null,
      website: website || null,
      email,
      phone,
      location: Array.isArray(location) ? location : [location].filter(Boolean),
      industry_focus: industryFocus || null,
      skills: skills || null,
      years_experience: yearsExperience || null,
      comfort_food: comfortFood,
      referral_source: referralSource || null,
      referred_by_name: referredByName || null,
      referred_by_email: referredByEmail || null,
      hoping_to_get: hopingToGet,
      excited_to_contribute: excitedToContribute,
      photo_url: photoUrl || null,
      status: "pending",
    });

    if (error) {
      console.error("Supabase insert failed:", error.message);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
