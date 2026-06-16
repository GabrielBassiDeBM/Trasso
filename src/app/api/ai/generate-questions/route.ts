import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuestions } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import type { GenerateQuestionsInput } from "@/lib/ai/provider";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { ok } = await checkRateLimit("generate");
    if (!ok) return NextResponse.json({ error: "Daily limit reached (100 generations/day)" }, { status: 429 });

    const body = await req.json() as GenerateQuestionsInput;
    if (!body.topic || !body.count || !body.types?.length) {
      return NextResponse.json({ error: "topic, count, and types are required" }, { status: 400 });
    }

    const questions = await generateQuestions(body);
    await recordUsage("generate");

    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate questions";
    console.error("[generate-questions]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
