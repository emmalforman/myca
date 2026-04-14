import { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const MEMBER_SELECT =
  "name, email, company, role, occupation_type, location, industry_tags, focus_areas, skills, interests, superpower, offers, asks, notes, communities";

/**
 * Two-pass member search:
 * 1. Full-text search (tsvector) for keyword matches
 * 2. If too few results, use Claude to expand query into related keywords and retry
 * 3. Return combined, deduplicated candidates
 */
export async function searchMembers(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  query: string,
  excludeEmail: string,
  limit: number = 25
): Promise<{ members: any[]; totalCount: number }> {
  // Get total member count for context
  const { count: totalCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("is_myca_member", true);

  // Pass 1: Try full-text search with the original query
  let results = await fullTextSearch(supabase, query, excludeEmail, limit);

  // Pass 2: If too few results, expand query with Claude and retry
  if (results.length < 8) {
    const expandedQuery = await expandQueryWithClaude(anthropic, query);
    if (expandedQuery !== query) {
      const moreResults = await fullTextSearch(
        supabase,
        expandedQuery,
        excludeEmail,
        limit
      );
      // Merge and deduplicate by email
      const seen = new Set(results.map((r: any) => r.email));
      for (const r of moreResults) {
        if (!seen.has(r.email)) {
          results.push(r);
          seen.add(r.email);
        }
      }
    }
  }

  // Pass 3: If still very few results, fall back to loading all members
  // so Claude can still try to find matches from context clues
  if (results.length < 3) {
    const { data: allMembers } = await supabase
      .from("contacts")
      .select(MEMBER_SELECT)
      .eq("is_myca_member", true)
      .neq("email", excludeEmail);
    if (allMembers && allMembers.length > 0) {
      results = allMembers;
    }
  }

  return { members: results.slice(0, limit), totalCount: totalCount || 0 };
}

async function fullTextSearch(
  supabase: SupabaseClient,
  query: string,
  excludeEmail: string,
  limit: number
): Promise<any[]> {
  // Try the RPC function first (uses websearch_to_tsquery for better natural language handling)
  const { data, error } = await supabase.rpc("search_contacts", {
    query_text: query,
    match_limit: limit,
  });

  if (!error && data && data.length > 0) {
    return data.filter((r: any) => r.email !== excludeEmail);
  }

  // Fallback: use ilike on key fields if RPC fails or returns nothing
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (searchTerms.length === 0) return [];

  // Search across multiple columns with OR
  const orConditions = searchTerms
    .flatMap((term) => [
      `name.ilike.%${term}%`,
      `company.ilike.%${term}%`,
      `role.ilike.%${term}%`,
      `industry_tags.ilike.%${term}%`,
      `skills.ilike.%${term}%`,
      `interests.ilike.%${term}%`,
      `superpower.ilike.%${term}%`,
      `offers.ilike.%${term}%`,
      `asks.ilike.%${term}%`,
      `notes.ilike.%${term}%`,
      `occupation_type.ilike.%${term}%`,
    ])
    .join(",");

  const { data: fallbackData } = await supabase
    .from("contacts")
    .select(MEMBER_SELECT)
    .eq("is_myca_member", true)
    .neq("email", excludeEmail)
    .or(orConditions)
    .limit(limit);

  return fallbackData || [];
}

async function expandQueryWithClaude(
  anthropic: Anthropic,
  query: string
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system:
        "You help expand search queries for a women's community in food, CPG, agriculture, and hospitality. Given a user query, return a space-separated list of search keywords including synonyms, related terms, and industry-specific terms. Include the original terms too. Return ONLY the keywords, nothing else.",
      messages: [{ role: "user", content: query }],
    });
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim() || query;
  } catch {
    return query;
  }
}
