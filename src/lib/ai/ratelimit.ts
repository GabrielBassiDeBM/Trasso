"use server";

import { createClient } from "@/lib/supabase/server";
import type { AiUsageKind } from "@/lib/types/database";

const DAILY_LIMITS: Record<string, number> = {
  extract: 50,
  generate: 100,
  classify: 200,
};

export async function checkRateLimit(kind: AiUsageKind): Promise<{ ok: boolean; remaining: number }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, remaining: 0 };

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userData.user.id)
    .eq("kind", kind)
    .gte("created_at", since.toISOString());

  const used = count ?? 0;
  const limit = DAILY_LIMITS[kind] ?? 100;
  return { ok: used < limit, remaining: limit - used };
}

export async function recordUsage(kind: AiUsageKind, tokensIn = 0, tokensOut = 0) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  await supabase.from("ai_usage").insert({
    owner_id: userData.user.id,
    kind,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
}
