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
    tiktok,
    twitter,
    substack,
    website,
    email,
    phone,
    location,
    industryFocus,
    skills,
    interests,
    superpower,
    asks,
    offers,
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
    !instagram ||
    !phone ||
    !referralSource ||
    !skills ||
    !interests ||
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
      tiktok: tiktok || null,
      twitter: twitter || null,
      substack: substack || null,
      website: website || null,
      email,
      phone,
      location: Array.isArray(location) ? location : [location].filter(Boolean),
      industry_focus: industryFocus || null,
      skills: skills || null,
      interests: interests || null,
      superpower: superpower || null,
      asks: asks || null,
      offers: offers || null,
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

    // Send notification email to admins (fire-and-forget)
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAILS) {
      const adminEmails = process.env.ADMIN_EMAILS
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (request.headers.get("host")
          ? `https://${request.headers.get("host")}`
          : "https://myca-ecru.vercel.app");

      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Myca <notifications@mycacollective.com>",
          to: adminEmails,
          subject: `New Myca application: ${fullName}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
              <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #6b7280; margin: 0 0 16px 0;">
                New Application
              </p>
              <h1 style="font-size: 24px; margin: 0 0 24px 0; font-weight: 500;">${fullName}</h1>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Title</td><td style="padding: 8px 0;">${title}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Company</td><td style="padding: 8px 0;">${company}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Occupation</td><td style="padding: 8px 0;">${occupation}</td></tr>
                ${industryFocus ? `<tr><td style="padding: 8px 0; color: #6b7280;">Industry</td><td style="padding: 8px 0;">${industryFocus}</td></tr>` : ""}
                ${location ? `<tr><td style="padding: 8px 0; color: #6b7280;">Location</td><td style="padding: 8px 0;">${Array.isArray(location) ? location.join(", ") : location}</td></tr>` : ""}
                ${linkedin ? `<tr><td style="padding: 8px 0; color: #6b7280;">LinkedIn</td><td style="padding: 8px 0;"><a href="${linkedin}">${linkedin}</a></td></tr>` : ""}
                ${referredByName ? `<tr><td style="padding: 8px 0; color: #6b7280;">Referred by</td><td style="padding: 8px 0;">${referredByName}</td></tr>` : ""}
              </table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <a href="${baseUrl}/admin" style="display: inline-block; padding: 12px 24px; background: #1a2e1a; color: #f5f1e8; text-decoration: none; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
                  Review in Admin
                </a>
              </div>
            </div>
          `,
        }),
      }).catch((err) => {
        console.error("Failed to send admin notification email:", err);
      });
    }
  }

  return NextResponse.json({ success: true });
}
