import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractQuestions } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { ok } = await checkRateLimit("extract");
    if (!ok) return NextResponse.json({ error: "Daily limit reached (50 extractions/day)" }, { status: 429 });

    const body = await req.json() as { fileBase64?: string; mimeType?: string };
    if (!body.fileBase64 || !body.mimeType) {
      return NextResponse.json({ error: "fileBase64 and mimeType are required" }, { status: 400 });
    }

    const questions = await extractQuestions({ fileBase64: body.fileBase64, mimeType: body.mimeType });
    await recordUsage("extract");

    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process image";
    console.error("[scan-question]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
