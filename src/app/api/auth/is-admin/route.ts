import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  return NextResponse.json({ isAdmin: isAdmin(user?.email) });
}
