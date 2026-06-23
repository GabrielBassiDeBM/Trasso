import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractQuestions } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import { checkIpRateLimit } from "@/lib/ai/ipRatelimit";
import { scanQuestionSchema, MAX_SCAN_BASE64_CHARS } from "@/lib/ai/schemas";
import { parseJsonBody, badRequest, safeErrorResponse } from "@/lib/api/handler";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Reject oversized payloads before even buffering the JSON body.
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SCAN_BASE64_CHARS + 4096) {
      return badRequest("File too large");
    }

    const ipLimit = checkIpRateLimit(req, "ai-scan");
    if (!ipLimit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { ok } = await checkRateLimit("extract");
    if (!ok) return NextResponse.json({ error: "Daily limit reached (50 extractions/day)" }, { status: 429 });

    const parsed = await parseJsonBody(req, scanQuestionSchema);
    if ("response" in parsed) return parsed.response;

    const questions = await extractQuestions(parsed.data);
    await recordUsage("extract");

    return NextResponse.json({ questions });
  } catch (err) {
    return safeErrorResponse("scan-question", err);
  }
}
