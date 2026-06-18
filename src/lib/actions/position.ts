import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/** Questions and question_groups (passage/section header blocks) share one position axis. */
export async function getNextSheetPosition(
  supabase: SupabaseClient<Database>,
  sheetId: string,
): Promise<number> {
  const [{ data: lastItem }, { data: lastGroup }] = await Promise.all([
    supabase
      .from("sheet_questions")
      .select("position")
      .eq("sheet_id", sheetId)
      .order("position", { ascending: false })
      .limit(1),
    supabase
      .from("question_groups")
      .select("position")
      .eq("sheet_id", sheetId)
      .order("position", { ascending: false })
      .limit(1),
  ]);

  const maxItem = lastItem && lastItem.length > 0 ? lastItem[0].position : -1;
  const maxGroup = lastGroup && lastGroup.length > 0 ? lastGroup[0].position : -1;
  return Math.max(maxItem, maxGroup) + 1;
}
