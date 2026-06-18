import { createClient } from "@/lib/supabase/server";
import type { Database, Difficulty, QuestionType } from "@/lib/types/database";
import type { GroupItem } from "@/components/sheets/QuestionGroupEditor";

export type SheetRow = Database["public"]["Tables"]["sheets"]["Row"];
export type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
export type SheetQuestionRow = Database["public"]["Tables"]["sheet_questions"]["Row"];
export type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
export type TopicRow = Database["public"]["Tables"]["topics"]["Row"];

export interface SheetQuestionWithQuestion extends SheetQuestionRow {
  question: QuestionRow | null;
}

export interface DashboardStats {
  sheetsCount: number;
  questionsCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const [{ count: sheetsCount }, { count: questionsCount }] = await Promise.all([
    supabase.from("sheets").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
  ]);
  return { sheetsCount: sheetsCount ?? 0, questionsCount: questionsCount ?? 0 };
}

export interface SheetFilters {
  examType?: string;
  subjectId?: string;
  search?: string;
}

export async function getSheets(filters: SheetFilters = {}): Promise<SheetRow[]> {
  const supabase = await createClient();
  let q = supabase.from("sheets").select("*").order("updated_at", { ascending: false });
  if (filters.examType) q = q.eq("exam_type", filters.examType as "prova" | "lista" | "simulado" | "recuperacao");
  if (filters.subjectId) q = q.eq("subject_id", filters.subjectId);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export interface SheetWithTaxonomy extends Omit<SheetRow, "difficulty"> {
  subjectIds: string[];
  topicIds: string[];
  difficulty: Difficulty | "mixed" | null;
}

/** Subjects, topics, and difficulty are chosen once at sheet-creation time (see NewSheetModal) and stored on the row — not derived from the sheet's questions. */
export async function getSheetsWithTaxonomy(filters: SheetFilters = {}): Promise<SheetWithTaxonomy[]> {
  const sheets = await getSheets(filters);
  return sheets.map((sheet) => ({
    ...sheet,
    subjectIds: sheet.subject_ids?.length ? sheet.subject_ids : sheet.subject_id ? [sheet.subject_id] : [],
    topicIds: sheet.topic_ids ?? [],
    difficulty: sheet.difficulty ?? "mixed",
  }));
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

export async function getSheetGroups(sheetId: string): Promise<GroupItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_groups")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((g) => ({
    id: g.id,
    instructions: g.instructions,
    passage: g.passage,
    passage_format: g.passage_format,
    block_type: g.block_type as GroupItem["block_type"],
    title: g.title,
    position: g.position,
    level: g.level,
  }));
}

// ─── Question bank queries ────────────────────────────────────────────────────

export interface BankFilters {
  subjectId?: string;
  subjectIds?: string[];
  topicId?: string;
  topicIds?: string[];
  difficulty?: string;
  difficulties?: string[];
  type?: string;
  types?: string[];
  isAdapted?: boolean;
  search?: string;
}

export async function getBankQuestions(filters: BankFilters = {}, scope: "public" | "personal" = "public") {
  const supabase = await createClient();

  let q = supabase
    .from("questions")
    .select("*, subject:subjects(id,name), topic:topics(id,name)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (scope === "public") {
    q = q.eq("is_public", true);
  } else {
    q = q.eq("is_public", false);
  }

  if (filters.subjectIds && filters.subjectIds.length > 0) {
    q = q.in("subject_id", filters.subjectIds);
  } else if (filters.subjectId) {
    q = q.eq("subject_id", filters.subjectId);
  }
  if (filters.topicIds && filters.topicIds.length > 0) {
    q = q.in("topic_id", filters.topicIds);
  } else if (filters.topicId) {
    q = q.eq("topic_id", filters.topicId);
  }

  if (filters.difficulties && filters.difficulties.length > 0) {
    q = q.in("difficulty", filters.difficulties as Difficulty[]);
  } else if (filters.difficulty) {
    q = q.eq("difficulty", filters.difficulty as Difficulty);
  }

  if (filters.types && filters.types.length > 0) {
    q = q.in("type", filters.types as QuestionType[]);
  } else if (filters.type) {
    q = q.eq("type", filters.type as QuestionType);
  }

  if (filters.isAdapted !== undefined) q = q.eq("is_adapted", filters.isAdapted);
  if (filters.search) {
    q = q.textSearch("search", filters.search, { type: "websearch", config: "portuguese" });
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getPersonalQuestions(filters: BankFilters = {}) {
  return getBankQuestions(filters, "personal");
}

export async function getSubjects(): Promise<SubjectRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("*").order("name");
  return data ?? [];
}

export async function getTopics(subjectId?: string): Promise<TopicRow[]> {
  const supabase = await createClient();
  let q = supabase.from("topics").select("*").order("name");
  if (subjectId) q = q.eq("subject_id", subjectId);
  const { data } = await q;
  return data ?? [];
}

// ─── Org / folder queries ─────────────────────────────────────────────────────

export async function getUserOrgs() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  type OrgMemberRow = {
    role: Database["public"]["Tables"]["organization_members"]["Row"]["role"];
    organization: Database["public"]["Tables"]["organizations"]["Row"] | null;
  };

  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", userData.user.id);

  return ((data ?? []) as unknown as OrgMemberRow[]).map((row) => ({
    role: row.role,
    org: row.organization as Database["public"]["Tables"]["organizations"]["Row"],
  }));
}

export async function getFolders(orgId?: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  let q = supabase.from("folders").select("*").order("name");
  if (orgId) {
    q = q.eq("org_id", orgId);
  } else {
    q = q.is("org_id", null).eq("owner_id", userData.user.id);
  }

  const { data } = await q;
  return data ?? [];
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export async function getSheetVariants(sheetId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sheet_variants")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("created_at");
  return data ?? [];
}

// ─── Exam results ─────────────────────────────────────────────────────────────

export async function getExamResults(sheetId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_results")
    .select("*, variant:sheet_variants(label)")
    .eq("sheet_id", sheetId)
    .order("graded_at", { ascending: false });
  return data ?? [];
}
