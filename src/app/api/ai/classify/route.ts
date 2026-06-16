import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifySubject } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { ok } = await checkRateLimit("classify");
  if (!ok) return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });

  const { statement } = await req.json() as { statement?: string };
  if (!statement) return NextResponse.json({ error: "statement is required" }, { status: 400 });

  const result = await classifySubject(statement);
  await recordUsage("classify");

  return NextResponse.json(result);
}
