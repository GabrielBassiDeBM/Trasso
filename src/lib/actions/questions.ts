"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSheet, getBankQuestions, type BankFilters } from "@/lib/data/sheets";
import { defaultContentForType, fromDbRow, toDbColumns, type QuestionContent } from "@/lib/types/question";
import { getNextSheetPosition } from "@/lib/actions/position";
import type { Difficulty, QuestionType } from "@/lib/types/database";

export interface AddQuestionResult {
  sheetQuestionId: string;
  questionId: string;
  content: QuestionContent;
  position: number;
  subjectId: string | null;
  topicId: string | null;
  difficulty: Difficulty | null;
}

export type ActionResult<T> = T | { error: string };

export async function addQuestionAction(
  sheetId: string,
  type: QuestionType,
  prefillContent?: QuestionContent,
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

  const nextPosition = await getNextSheetPosition(supabase, sheetId);

  const { data: link, error: linkError } = await supabase
    .from("sheet_questions")
    .insert({
      sheet_id: sheetId,
      question_id: question.id,
      position: nextPosition,
      points: 1,
    })
    .select("id")
    .single();

  if (linkError || !link) {
    return { error: linkError?.message ?? "Could not add question to sheet." };
  }

  revalidatePath(`/sheets/${sheetId}`);
  return {
    sheetQuestionId: link.id,
    questionId: question.id,
    content,
    position: nextPosition,
    subjectId: null,
    topicId: null,
    difficulty: null,
  };
}

export interface BatchAddResult {
  added: AddQuestionResult[];
  /** Count of items that failed to insert (the request still succeeds for the rest). */
  failed: number;
}

/**
 * Inserts several questions at once (e.g. accepting an AI-generated batch). Runs the
 * per-question inserts concurrently instead of one full request-response cycle at a time,
 * and looks up the starting sheet position and revalidates the path once for the whole
 * batch rather than once per question.
 */
export async function addQuestionsBatchAction(
  sheetId: string,
  items: { type: QuestionType; content: QuestionContent }[],
): Promise<ActionResult<BatchAddResult>> {
  if (items.length === 0) return { added: [], failed: 0 };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired. Please sign in again." };
  const ownerId = userData.user.id;

  const sheet = await getSheet(sheetId);
  const defaultAnswerLines = (sheet?.page_settings as { answerLines?: number } | null)?.answerLines;

  const preparedContents = items.map(({ content }) =>
    defaultAnswerLines && (content.type === "open" || content.type === "essay") && !content.answerLines
      ? { ...content, answerLines: defaultAnswerLines }
      : content,
  );

  const insertedQuestions = await Promise.all(
    preparedContents.map(async (content) => {
      const { data, error } = await supabase
        .from("questions")
        .insert({ owner_id: ownerId, ...toDbColumns(content) })
        .select("id")
        .single();
      if (error || !data) return null;
      return { questionId: data.id, content };
    }),
  );

  const successfulQuestions = insertedQuestions.filter(
    (r): r is { questionId: string; content: QuestionContent } => r !== null,
  );
  if (successfulQuestions.length === 0) {
    return { error: "Could not create any of the questions." };
  }

  const startPosition = await getNextSheetPosition(supabase, sheetId);

  const insertedLinks = await Promise.all(
    successfulQuestions.map(async (q, i) => {
      const { data, error } = await supabase
        .from("sheet_questions")
        .insert({ sheet_id: sheetId, question_id: q.questionId, position: startPosition + i, points: 1 })
        .select("id")
        .single();
      if (error || !data) return null;
      return { sheetQuestionId: data.id, position: startPosition + i, ...q };
    }),
  );

  const added: AddQuestionResult[] = insertedLinks
    .filter((r): r is { sheetQuestionId: string; position: number; questionId: string; content: QuestionContent } => r !== null)
    .map((r) => ({
      sheetQuestionId: r.sheetQuestionId,
      questionId: r.questionId,
      content: r.content,
      position: r.position,
      subjectId: null,
      topicId: null,
      difficulty: null,
    }));

  if (added.length > 0) revalidatePath(`/sheets/${sheetId}`);

  return { added, failed: items.length - added.length };
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

export async function removeQuestionAction(
  sheetId: string,
  sheetQuestionId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheet_questions").delete().eq("id", sheetQuestionId);
  revalidatePath(`/sheets/${sheetId}`);
}

// ─── Question bank actions ────────────────────────────────────────────────────

export interface BankSearchQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  difficulty: Difficulty | null;
  subject: { id: string; name: string } | null;
  topic: { id: string; name: string } | null;
}

export async function searchBankQuestionsAction(
  scope: "public" | "personal",
  filters: BankFilters,
): Promise<BankSearchQuestion[]> {
  const rows = (await getBankQuestions(filters, scope)) as unknown as Array<{
    id: string;
    statement: string;
    type: QuestionType;
    difficulty: Difficulty | null;
    subject: { id: string; name: string } | null;
    topic: { id: string; name: string } | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    statement: row.statement,
    type: row.type,
    difficulty: row.difficulty,
    subject: row.subject,
    topic: row.topic,
  }));
}

export async function deleteQuestionFromBankAction(questionId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { data: question } = await supabase
    .from("questions")
    .select("owner_id")
    .eq("id", questionId)
    .maybeSingle();

  if (!question || question.owner_id !== userData.user.id) {
    return { error: "Question not found or access denied." };
  }

  await supabase.from("sheet_questions").delete().eq("question_id", questionId);
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  if (error) return { error: error.message };

  revalidatePath("/banco");
  return { error: null };
}

export async function createBankQuestionAction({
  content,
  subjectId,
  topicId,
  difficulty,
}: {
  content: QuestionContent;
  subjectId?: string | null;
  topicId?: string | null;
  difficulty?: string | null;
}): Promise<{ error: string | null; questionId?: string }> {
  if (!content.statement.trim()) return { error: "Statement is required." };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const columns = toDbColumns(content);

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      owner_id: userData.user.id,
      ...columns,
      subject_id: subjectId ?? null,
      topic_id: topicId ?? null,
      difficulty: (difficulty as Difficulty | null) ?? null,
    })
    .select("id")
    .single();

  if (error || !question) return { error: error?.message ?? "Could not create question." };
  revalidatePath("/banco");
  return { error: null, questionId: question.id };
}

export interface BankQuestionForEdit {
  content: QuestionContent;
  subjectId: string | null;
  topicId: string | null;
  difficulty: string | null;
}

export async function getBankQuestionForEditAction(
  questionId: string,
): Promise<ActionResult<BankQuestionForEdit>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { data: question, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (error || !question) return { error: "Question not found." };
  if (question.owner_id !== userData.user.id) return { error: "Access denied." };

  return {
    content: fromDbRow(question),
    subjectId: question.subject_id ?? null,
    topicId: question.topic_id ?? null,
    difficulty: question.difficulty ?? null,
  };
}

export async function updateBankQuestionAction({
  questionId,
  content,
  subjectId,
  topicId,
  difficulty,
}: {
  questionId: string;
  content: QuestionContent;
  subjectId?: string | null;
  topicId?: string | null;
  difficulty?: string | null;
}): Promise<{ error: string | null }> {
  if (!content.statement.trim()) return { error: "Statement is required." };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { data: question } = await supabase
    .from("questions")
    .select("owner_id")
    .eq("id", questionId)
    .maybeSingle();

  if (!question || question.owner_id !== userData.user.id) {
    return { error: "Question not found or access denied." };
  }

  const columns = toDbColumns(content);
  const { error } = await supabase
    .from("questions")
    .update({
      ...columns,
      subject_id: subjectId ?? null,
      topic_id: topicId ?? null,
      difficulty: (difficulty as Difficulty | null) ?? null,
    })
    .eq("id", questionId);

  if (error) return { error: error.message };
  revalidatePath("/banco");
  return { error: null };
}

export async function deleteManyFromBankAction(questionIds: string[]): Promise<{ error: string | null }> {
  if (questionIds.length === 0) return { error: null };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { data: owned } = await supabase
    .from("questions")
    .select("id")
    .in("id", questionIds)
    .eq("owner_id", userData.user.id);

  if (!owned || owned.length === 0) return { error: "No owned questions found." };
  const ownedIds = owned.map((q) => q.id);

  await supabase.from("sheet_questions").delete().in("question_id", ownedIds);
  const { error } = await supabase.from("questions").delete().in("id", ownedIds);
  if (error) return { error: error.message };

  revalidatePath("/banco");
  return { error: null };
}

export async function addManyToPersonalBankAction(questionIds: string[]): Promise<{ error: string | null }> {
  if (questionIds.length === 0) return { error: null };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { data: rows, error: fetchError } = await supabase
    .from("questions")
    .select(
      "statement, statement_format, type, options, answer, subject_id, topic_id, difficulty, has_math, source, tags, bncc_code, solution, solution_format",
    )
    .in("id", questionIds);

  if (fetchError) return { error: fetchError.message };
  if (!rows || rows.length === 0) return { error: "Questions not found." };

  const copies = rows.map((row) => ({
    ...row,
    owner_id: userData.user!.id,
    is_public: false,
  }));

  const { error } = await supabase.from("questions").insert(copies);
  if (error) return { error: error.message };

  revalidatePath("/banco");
  return { error: null };
}

export async function pullManyFromBankAction(
  sheetId: string,
  bankQuestionIds: string[],
): Promise<{ error: string | null }> {
  if (bankQuestionIds.length === 0) return { error: null };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const startPosition = await getNextSheetPosition(supabase, sheetId);

  const { error } = await supabase.from("sheet_questions").insert(
    bankQuestionIds.map((qId, i) => ({
      sheet_id: sheetId,
      question_id: qId,
      position: startPosition + i,
      points: 1,
    })),
  );

  if (error) return { error: error.message };
  revalidatePath(`/sheets/${sheetId}`);
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

  const nextPosition = await getNextSheetPosition(supabase, sheetId);

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
  return {
    sheetQuestionId: link.id,
    questionId: bankQuestionId,
    content: fromDbRow(bq),
    position: nextPosition,
    subjectId: bq.subject_id,
    topicId: bq.topic_id,
    difficulty: bq.difficulty,
  };
}
