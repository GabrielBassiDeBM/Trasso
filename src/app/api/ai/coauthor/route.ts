import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformQuestion } from "@/lib/ai/provider";
import { checkRateLimit, recordUsage } from "@/lib/ai/ratelimit";
import type { CoauthorAction } from "@/lib/ai/provider";
import type { QuestionContent } from "@/lib/types/question";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { ok } = await checkRateLimit("generate");
    if (!ok) return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });

    const { content, action } = await req.json() as { content?: QuestionContent; action?: CoauthorAction };
    if (!content || !action) {
      return NextResponse.json({ error: "content and action are required" }, { status: 400 });
    }

    const result = await transformQuestion(content, action);
    await recordUsage("generate");

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to transform question";
    console.error("[coauthor]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
