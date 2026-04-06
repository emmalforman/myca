import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET all content
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const { data, error } = await supabase
    .from("site_content")
    .select("key, value");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const content: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    content[row.key] = row.value;
  });

  return NextResponse.json({ content });
}

// PATCH update content
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");

  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates = await request.json();

  for (const [key, value] of Object.entries(updates)) {
    await supabase
      .from("site_content")
      .upsert({ key, value: value as string, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }

  return NextResponse.json({ success: true });
}
