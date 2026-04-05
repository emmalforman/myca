import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    company,
    title,
    occupation,
    linkedin,
    email,
    phone,
    location,
    comfortFood,
    hopingToGet,
    excitedToContribute,
    photoUrl,
  } = body;

  // Validate required fields
  if (!name || !company || !title || !email || !linkedin || !comfortFood || !hopingToGet || !excitedToContribute) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Save to Supabase if configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { supabase } = await import("@/lib/supabase");
    const { error } = await supabase.from("applications").insert({
      full_name: name,
      company,
      title,
      occupation: occupation || null,
      linkedin,
      email,
      phone: phone || null,
      location: location || [],
      comfort_food: comfortFood,
      hoping_to_get: hopingToGet,
      excited_to_contribute: excitedToContribute,
      photo_url: photoUrl || null,
    });

    if (error) {
      console.error("Supabase insert failed:", error.message);
    }
  }

  // Submit to Notion if configured
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
    try {
      const { submitApplication } = await import("@/lib/notion");
      await submitApplication({
        name,
        company,
        title,
        occupation: occupation || "",
        linkedin,
        email,
        phone: phone || "",
        location: location || [],
        comfortFood,
        hopingToGet,
        excitedToContribute,
        photoUrl,
      });
    } catch (err: any) {
      console.error("Notion submit failed:", err.message);
      // Don't fail the request if Notion fails but Supabase succeeded
    }
  }

  return NextResponse.json({ success: true });
}
