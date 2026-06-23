import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuestions } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import { checkIpRateLimit } from "@/lib/ai/ipRatelimit";
import { generateQuestionsSchema } from "@/lib/ai/schemas";
import { parseJsonBody, safeErrorResponse } from "@/lib/api/handler";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const ipLimit = checkIpRateLimit(req, "ai");
    if (!ipLimit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { ok } = await checkRateLimit("generate");
    if (!ok) return NextResponse.json({ error: "Daily limit reached (100 generations/day)" }, { status: 429 });

    const parsed = await parseJsonBody(req, generateQuestionsSchema);
    if ("response" in parsed) return parsed.response;

    const questions = await generateQuestions(parsed.data);
    await recordUsage("generate");

    return NextResponse.json({ questions });
  } catch (err) {
    return safeErrorResponse("generate-questions", err);
  }
}
