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

export async function addQuestionAction(sheetId: string, type: QuestionType): Promise<ActionResult<AddQuestionResult>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const sheet = await getSheet(sheetId);
  const defaultAnswerLines = (sheet?.page_settings as { answerLines?: number } | null)?.answerLines;

  let content = defaultContentForType(type);
  if (defaultAnswerLines && (content.type === "open" || content.type === "essay")) {
    content = { ...content, answerLines: defaultAnswerLines };
  }

  const columns = toDbColumns(content);

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({ owner_id: userData.user.id, ...columns })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: questionError?.message ?? "Não foi possível criar a questão." };
  }

  const { data: last, error: positionError } = await supabase
    .from("sheet_questions")
    .select("position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: false })
    .limit(1);

  if (positionError) {
    return { error: positionError.message };
  }

  const nextPosition = last && last.length > 0 ? last[0].position + 1 : 0;

  const { data: link, error: linkError } = await supabase
    .from("sheet_questions")
    .insert({ sheet_id: sheetId, question_id: question.id, position: nextPosition, points: 1 })
    .select("id")
    .single();

  if (linkError || !link) {
    return { error: linkError?.message ?? "Não foi possível adicionar a questão à lista." };
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

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/sheets/${sheetId}`);
  return { error: null };
}

export async function updateQuestionPointsAction(sheetId: string, sheetQuestionId: string, points: number | null): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheet_questions").update({ points }).eq("id", sheetQuestionId);

  revalidatePath(`/sheets/${sheetId}`);
}

export async function reorderQuestionsAction(sheetId: string, orderedSheetQuestionIds: string[]): Promise<void> {
  const supabase = await createClient();

  await Promise.all(
    orderedSheetQuestionIds.map((id, index) => supabase.from("sheet_questions").update({ position: index }).eq("id", id)),
  );

  revalidatePath(`/sheets/${sheetId}`);
}

export async function removeQuestionAction(sheetId: string, sheetQuestionId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheet_questions").delete().eq("id", sheetQuestionId);

  revalidatePath(`/sheets/${sheetId}`);
}
