import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSheet } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import type { GenerateSheetInput } from "@/lib/ai/provider";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { ok } = await checkRateLimit("generate");
    if (!ok) return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });

    const body = await req.json() as GenerateSheetInput;
    if (!body.subject || !body.gradeLevel || !body.questionCount) {
      return NextResponse.json({ error: "subject, gradeLevel, and questionCount are required" }, { status: 400 });
    }

    const result = await generateSheet(body);
    await recordUsage("generate");

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate sheet";
    console.error("[generate-sheet]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
