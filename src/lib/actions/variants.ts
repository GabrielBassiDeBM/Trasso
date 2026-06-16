"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSheetQuestions } from "@/lib/data/sheets";
import { fromDbRow } from "@/lib/types/question";
import type { Json } from "@/lib/types/database";

interface AnswerKey {
  [position: number]: string | boolean | string[];
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = ((s * 1103515245 + 12345) >>> 0) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function createVariantsAction(
  sheetId: string,
  count: number,
  shuffleOptions: boolean,
): Promise<{ error: string | null; variantIds: string[] }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired.", variantIds: [] };

  const sheetQuestions = await getSheetQuestions(sheetId);
  const questions = sheetQuestions
    .filter((sq) => sq.question !== null)
    .map((sq) => ({ sqId: sq.id, content: fromDbRow(sq.question!) }));

  const variantIds: string[] = [];

  for (let v = 0; v < count; v++) {
    const seed = Date.now() + v * 7919;
    const shuffledQs = seededShuffle(questions, seed);
    const answerKey: AnswerKey = {};

    shuffledQs.forEach((q, idx) => {
      const { content } = q;
      switch (content.type) {
        case "multiple_choice": {
          const opts = shuffleOptions
            ? seededShuffle(content.options, seed + idx)
            : content.options;
          answerKey[idx] = opts.filter((o) => o.is_correct).map((o) => o.key);
          break;
        }
        case "true_false":
          answerKey[idx] = content.answer;
          break;
        case "fill_blank":
          answerKey[idx] = Object.values(content.blanks).join(" / ");
          break;
        default:
          answerKey[idx] = "";
      }
    });

    const label = `Version ${String.fromCharCode(65 + v)}`;

    const { data, error } = await supabase
      .from("sheet_variants")
      .insert({
        sheet_id: sheetId,
        label,
        seed,
        answer_key: answerKey as unknown as Json,
      })
      .select("id")
      .single();

    if (error || !data) return { error: error?.message ?? "Erro ao criar variante.", variantIds };
    variantIds.push(data.id);
  }

  revalidatePath(`/sheets/${sheetId}`);
  return { error: null, variantIds };
}

export async function deleteVariantsAction(sheetId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheet_variants").delete().eq("sheet_id", sheetId);
  revalidatePath(`/sheets/${sheetId}`);
}
