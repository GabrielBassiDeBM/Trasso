import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifySubject } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import { checkIpRateLimit } from "@/lib/ai/ipRatelimit";
import { classifySchema } from "@/lib/ai/schemas";
import { parseJsonBody, safeErrorResponse } from "@/lib/api/handler";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const ipLimit = checkIpRateLimit(req, "ai");
    if (!ipLimit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { ok } = await checkRateLimit("classify");
    if (!ok) return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });

    const parsed = await parseJsonBody(req, classifySchema);
    if ("response" in parsed) return parsed.response;

    const result = await classifySubject(parsed.data.statement);
    await recordUsage("classify");

    return NextResponse.json(result);
  } catch (err) {
    return safeErrorResponse("classify", err);
  }
}
