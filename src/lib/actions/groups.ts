"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GroupItem } from "@/components/sheets/QuestionGroupEditor";

export async function addGroupAction(
  sheetId: string,
  position: number
): Promise<GroupItem | { error: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { data, error } = await supabase
    .from("question_groups")
    .insert({ sheet_id: sheetId, position })
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create block." };

  revalidatePath(`/sheets/${sheetId}`);
  return {
    id: data.id,
    instructions: data.instructions,
    passage: data.passage,
    passage_format: data.passage_format,
    position: data.position,
  };
}

export async function updateGroupAction(
  groupId: string,
  updates: { passage?: string | null; instructions?: string | null }
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("question_groups").update(updates).eq("id", groupId);
}

export async function removeGroupAction(groupId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("question_groups").delete().eq("id", groupId);
}
