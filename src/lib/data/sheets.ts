import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type SheetRow = Database["public"]["Tables"]["sheets"]["Row"];
export type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
export type SheetQuestionRow = Database["public"]["Tables"]["sheet_questions"]["Row"];

export interface SheetQuestionWithQuestion extends SheetQuestionRow {
  question: QuestionRow | null;
}

export async function getSheets(): Promise<SheetRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sheets").select("*").order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSheet(id: string): Promise<SheetRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sheets").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSheetQuestions(sheetId: string): Promise<SheetQuestionWithQuestion[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("sheet_questions")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: true });

  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const questionIds = links.map((link) => link.question_id).filter((id): id is string => id !== null);

  let questionsById = new Map<string, QuestionRow>();
  if (questionIds.length > 0) {
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .in("id", questionIds);

    if (questionsError) throw questionsError;
    questionsById = new Map((questions ?? []).map((question) => [question.id, question]));
  }

  return links.map((link) => ({
    ...link,
    question: link.question_id ? questionsById.get(link.question_id) ?? null : null,
  }));
}
