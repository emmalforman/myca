import { NextResponse } from "next/server";
import { getMemberAccess, startTrial } from "@/lib/access";

export const dynamic = "force-dynamic";

// GET — check access status for a member
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const access = await getMemberAccess(email);

  if (!access) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json(access);
}

// POST — start a trial for an accepted member
export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const success = await startTrial(email);

  if (!success) {
    return NextResponse.json({ error: "Failed to start trial" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
