import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a company research assistant for Myca, a community of women in food, CPG, agriculture, and hospitality. Given a company name and optionally a person's role, return enriched metadata as JSON.

Return ONLY valid JSON with these fields:
{
  "industry": "one of: Food & Beverage, Agriculture, Food Tech, CPG, Hospitality & Restaurants, Health & Wellness, Retail, Investment, Media & Content, Sustainability, Other",
  "sub_category": "specific niche, e.g. Plant-Based, Snacks, Dairy, Baked Goods, Spices & Condiments, Beverages, Restaurant Tech, Farm-to-Table, Food Safety, Supply Chain, etc.",
  "business_model": "one of: DTC, B2B, B2B2C, Marketplace, Retail, SaaS, Services, Nonprofit, VC/PE, Media",
  "company_stage": "one of: pre-seed, seed, series-a, series-b, growth, public, acquired, bootstrapped",
  "company_size": "one of: 1-10, 11-50, 51-200, 201-500, 500+",
  "founded_year": 2020,
  "headquarters": "city or region",
  "description": "one sentence description of what the company does",
  "keywords": "comma-separated tags relevant for matching members with similar interests, e.g. plant-based,sustainability,snacks,women-founded"
}

If you don't know a field, use null. Be concise. Focus on food/CPG/agriculture industry context.`;

// Enrich a single company
async function enrichCompany(
  client: Anthropic,
  companyName: string,
  memberRole?: string,
  memberIndustryTags?: string
): Promise<Record<string, any>> {
  const prompt = `Company: ${companyName}${memberRole ? `\nPerson's role: ${memberRole}` : ""}${memberIndustryTags ? `\nIndustry context: ${memberIndustryTags}` : ""}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return {};
  }
}

// POST: enrich companies for all members (or a specific company)
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const body = await request.json().catch(() => ({}));
  const specificCompany = body.company as string | undefined;

  // Get companies to enrich
  let companies: { name: string; role?: string; industryTags?: string }[];

  if (specificCompany) {
    companies = [
      { name: specificCompany, role: body.role, industryTags: body.industryTags },
    ];
  } else {
    // Get all unique companies from contacts that aren't already enriched
    const { data: contacts } = await supabase
      .from("contacts")
      .select("company, role, industry_tags")
      .eq("is_myca_member", true)
      .not("company", "is", null);

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ message: "No companies to enrich", enriched: 0 });
    }

    // Get already enriched companies
    const { data: existing } = await supabase
      .from("company_metadata")
      .select("company_name");

    const enrichedNames = new Set(
      (existing || []).map((e: any) => e.company_name.toLowerCase())
    );

    // Deduplicate and filter
    const seen = new Set<string>();
    companies = [];
    for (const c of contacts) {
      const name = (c.company || "").trim();
      if (!name || seen.has(name.toLowerCase()) || enrichedNames.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      companies.push({
        name,
        role: c.role,
        industryTags: c.industry_tags,
      });
    }
  }

  if (companies.length === 0) {
    return NextResponse.json({ message: "All companies already enriched", enriched: 0 });
  }

  // Enrich in batches (respect rate limits)
  const results: any[] = [];
  const errors: any[] = [];

  for (const company of companies) {
    try {
      const metadata = await enrichCompany(
        anthropic,
        company.name,
        company.role,
        company.industryTags
      );

      const row = {
        company_name: company.name,
        industry: metadata.industry || null,
        sub_category: metadata.sub_category || null,
        business_model: metadata.business_model || null,
        company_stage: metadata.company_stage || null,
        company_size: metadata.company_size || null,
        founded_year: metadata.founded_year || null,
        headquarters: metadata.headquarters || null,
        description: metadata.description || null,
        keywords: metadata.keywords || null,
        enriched_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("company_metadata")
        .upsert(row, { onConflict: "company_name" });

      if (error) {
        errors.push({ company: company.name, error: error.message });
      } else {
        results.push({ company: company.name, ...metadata });
      }
    } catch (err: any) {
      errors.push({ company: company.name, error: err.message });
    }
  }

  return NextResponse.json({
    enriched: results.length,
    errors: errors.length,
    results,
    ...(errors.length > 0 ? { errorDetails: errors } : {}),
  });
}

// GET: retrieve company metadata
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ metadata: [] });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (company) {
    const { data } = await supabase
      .from("company_metadata")
      .select("*")
      .ilike("company_name", company)
      .single();

    return NextResponse.json({ metadata: data || null });
  }

  // Return all
  const { data } = await supabase
    .from("company_metadata")
    .select("*")
    .order("company_name");

  return NextResponse.json({ metadata: data || [] });
}
