import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    firstName,
    lastName,
    company,
    title,
    occupation,
    linkedin,
    email,
    phone,
    location,
    comfortFood,
    referralSource,
    hopingToGet,
    excitedToContribute,
    photoUrl,
  } = body;

  const fullName = name || `${firstName} ${lastName}`.trim();

  // Validate required fields
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

  // Save to Supabase applications table
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
      email,
      phone,
      location: Array.isArray(location) ? location : [location].filter(Boolean),
      comfort_food: comfortFood,
      referral_source: referralSource || null,
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
