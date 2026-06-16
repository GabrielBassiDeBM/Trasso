"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSheet } from "@/lib/data/sheets";
import { defaultContentForType, toDbColumns, type QuestionContent } from "@/lib/types/question";
import type { QuestionType } from "@/lib/types/database";

export interface AddQuestionResult {
  sheetQuestionId: string;
  questionId: string;
  content: QuestionContent;
}

export type ActionResult<T> = T | { error: string };

export async function addQuestionAction(
  sheetId: string,
  type: QuestionType,
  prefillContent?: QuestionContent,
  groupId?: string | null,
): Promise<ActionResult<AddQuestionResult>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired. Please sign in again." };

  const sheet = await getSheet(sheetId);
  const defaultAnswerLines = (sheet?.page_settings as { answerLines?: number } | null)?.answerLines;

  let content = prefillContent ?? defaultContentForType(type);
  if (!prefillContent && defaultAnswerLines && (content.type === "open" || content.type === "essay")) {
    content = { ...content, answerLines: defaultAnswerLines };
  }

  const columns = toDbColumns(content);

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({ owner_id: userData.user.id, ...columns })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: questionError?.message ?? "Could not create question." };
  }

  const { data: last, error: positionError } = await supabase
    .from("sheet_questions")
    .select("position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: false })
    .limit(1);

  if (positionError) return { error: positionError.message };

  const nextPosition = last && last.length > 0 ? last[0].position + 1 : 0;

  const { data: link, error: linkError } = await supabase
    .from("sheet_questions")
    .insert({
      sheet_id: sheetId,
      question_id: question.id,
      position: nextPosition,
      points: 1,
      group_id: groupId ?? null,
    })
    .select("id")
    .single();

  if (linkError || !link) {
    return { error: linkError?.message ?? "Could not add question to sheet." };
  }

  revalidatePath(`/sheets/${sheetId}`);
  return { sheetQuestionId: link.id, questionId: question.id, content };
}

export async function updateQuestionAction(
  sheetId: string,
  questionId: string,
  content: QuestionContent,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("questions").update(toDbColumns(content)).eq("id", questionId);

  if (error) return { error: error.message };
  revalidatePath(`/sheets/${sheetId}`);
  return { error: null };
}

export async function updateQuestionPointsAction(
  sheetId: string,
  sheetQuestionId: string,
  points: number | null,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheet_questions").update({ points }).eq("id", sheetQuestionId);
  revalidatePath(`/sheets/${sheetId}`);
}

export async function reorderQuestionsAction(
  sheetId: string,
  orderedSheetQuestionIds: string[],
): Promise<void> {
  const supabase = await createClient();
  await Promise.all(
    orderedSheetQuestionIds.map((id, index) =>
      supabase.from("sheet_questions").update({ position: index }).eq("id", id)
    ),
  );
  revalidatePath(`/sheets/${sheetId}`);
}

export async function removeQuestionAction(
  sheetId: string,
  sheetQuestionId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheet_questions").delete().eq("id", sheetQuestionId);
  revalidatePath(`/sheets/${sheetId}`);
}

// ─── Question bank actions ────────────────────────────────────────────────────

export async function saveQuestionToBankAction(questionId: string): Promise<{ error: string | null }> {
  // Questions created in the editor are already owned by the user — they're already in the bank.
  // This marks them for bank browsing by ensuring they have no sheet_questions entry pointing to a sheet.
  // For now, the bank just shows all owned questions.
  return { error: null };
}

export async function pullFromBankAction(
  sheetId: string,
  bankQuestionId: string,
): Promise<ActionResult<AddQuestionResult>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  // Fetch the bank question
  const { data: bq, error: bqError } = await supabase
    .from("questions")
    .select("*")
    .eq("id", bankQuestionId)
    .single();

  if (bqError || !bq) return { error: "Question not found." };

  // Get next position
  const { data: last } = await supabase
    .from("sheet_questions")
    .select("position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = last && last.length > 0 ? last[0].position + 1 : 0;

  const { data: link, error: linkError } = await supabase
    .from("sheet_questions")
    .insert({
      sheet_id: sheetId,
      question_id: bankQuestionId,
      position: nextPosition,
      points: 1,
    })
    .select("id")
    .single();

  if (linkError || !link) return { error: linkError?.message ?? "Failed to add question." };

  const { fromDbRow } = await import("@/lib/types/question");
  revalidatePath(`/sheets/${sheetId}`);
  return { sheetQuestionId: link.id, questionId: bankQuestionId, content: fromDbRow(bq) };
}
