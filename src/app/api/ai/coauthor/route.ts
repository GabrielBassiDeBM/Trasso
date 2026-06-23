import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformQuestion } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import { checkIpRateLimit } from "@/lib/ai/ipRatelimit";
import { coauthorSchema } from "@/lib/ai/schemas";
import { parseJsonBody, safeErrorResponse } from "@/lib/api/handler";
import type { QuestionContent } from "@/lib/types/question";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const ipLimit = checkIpRateLimit(req, "ai");
    if (!ipLimit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { ok } = await checkRateLimit("generate");
    if (!ok) return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });

    const parsed = await parseJsonBody(req, coauthorSchema);
    if ("response" in parsed) return parsed.response;

    const result = await transformQuestion(parsed.data.content as QuestionContent, parsed.data.action);
    await recordUsage("generate");

    return NextResponse.json(result);
  } catch (err) {
    return safeErrorResponse("coauthor", err);
  }
}
