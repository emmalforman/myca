import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// POST add member to group
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 400 }
    );
  }

  const { supabase } = await import("@/lib/supabase");
  const { groupId, memberId } = await request.json();

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, member_id: memberId });

  if (error) {
    // Ignore duplicate key errors
    if (error.code === "23505") {
      return NextResponse.json({ success: true, duplicate: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE remove member from group
export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 400 }
    );
  }

  const { supabase } = await import("@/lib/supabase");
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const memberId = searchParams.get("memberId");

  if (!groupId || !memberId) {
    return NextResponse.json(
      { error: "groupId and memberId are required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("member_id", memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
