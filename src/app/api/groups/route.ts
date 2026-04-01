import { NextResponse } from "next/server";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// GET all groups with their members
export async function GET() {
  if (!hasSupabase()) {
    return NextResponse.json({ groups: [], source: "none" });
  }

  const { supabase } = await import("@/lib/supabase");

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (groupsError) {
    return NextResponse.json({ error: groupsError.message }, { status: 500 });
  }

  // Fetch group members for each group
  const groupsWithMembers = await Promise.all(
    (groups || []).map(async (group) => {
      const { data: links } = await supabase
        .from("group_members")
        .select("member_id")
        .eq("group_id", group.id);

      const memberIds = (links || []).map((l) => l.member_id);
      let members: any[] = [];

      if (memberIds.length > 0) {
        const { data } = await supabase
          .from("members")
          .select("*")
          .in("id", memberIds);
        members = (data || []).map((row) => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          photoUrl: row.photo_url,
          title: row.title,
          company: row.company,
          location: row.location,
          industry: row.industry,
          bio: row.bio,
          tags: row.tags ?? [],
          linkedin: row.linkedin,
          twitter: row.twitter,
          website: row.website,
          joinedDate: row.joined_date,
        }));
      }

      return {
        id: group.id,
        name: group.name,
        members,
        createdAt: group.created_at,
      };
    })
  );

  return NextResponse.json({ groups: groupsWithMembers, source: "supabase" });
}

// POST create a new group
export async function POST(request: Request) {
  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 400 }
    );
  }

  const { supabase } = await import("@/lib/supabase");
  const body = await request.json();
  const { name, memberIds } = body as {
    name: string;
    memberIds?: string[];
  };

  if (!name) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }

  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add initial members if provided
  if (memberIds?.length && group) {
    await supabase.from("group_members").insert(
      memberIds.map((mid) => ({
        group_id: group.id,
        member_id: mid,
      }))
    );
  }

  return NextResponse.json({ group: { ...group, members: [] } });
}

// DELETE a group
export async function DELETE(request: Request) {
  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 400 }
    );
  }

  const { supabase } = await import("@/lib/supabase");
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("id");

  if (!groupId) {
    return NextResponse.json(
      { error: "Group ID is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
