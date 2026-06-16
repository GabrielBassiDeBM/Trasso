import { GoogleGenerativeAI, type GenerateContentResult } from "@google/generative-ai";
import type { QuestionContent, McqOption, MatchingItem } from "@/lib/types/question";
import type { Difficulty, QuestionType } from "@/lib/types/database";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractQuestionInput {
  fileBase64: string;
  mimeType: string;
}

export interface GenerateQuestionsInput {
  topic: string;
  count: number;
  types: QuestionType[];
  difficulty?: Difficulty;
  gradeLevel?: string;
  bnccCode?: string;
}

export interface GenerateSheetInput {
  title: string;
  subject: string;
  gradeLevel: string;
  topics: string[];
  questionCount: number;
  types: QuestionType[];
  difficulty?: Difficulty;
  examType?: string;
}

export interface GenerateSheetResult {
  title: string;
  questions: QuestionContent[];
  suggestedPoints: number;
}

export interface ClassifyResult {
  subjectName: string | null;
  topicName: string | null;
  difficulty: Difficulty | null;
  confidence: number;
}

export type CoauthorAction =
  | "harder"
  | "easier"
  | "distractor"
  | "simplify_language"
  | "check_ambiguity"
  | "worked_solution"
  | "variations";

export interface CoauthorResult {
  action: CoauthorAction;
  result: QuestionContent | string;
}

// ─── Gemini client ──────────────────────────────────────────────────────────

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured — see SETUP.md.");
  return new GoogleGenerativeAI(key);
}

function getModel(multimodal = false) {
  const client = getClient();
  return client.getGenerativeModel({
    model: multimodal ? "gemini-2.0-flash" : "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
}

function safeJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned);
}

function extractText(result: GenerateContentResult): string {
  return result.response.text();
}

// ─── Extract ALL questions from image ────────────────────────────────────────

export async function extractQuestions(input: ExtractQuestionInput): Promise<QuestionContent[]> {
  const model = getModel(true);
  const prompt = `You are an academic assistant specializing in SAT and AP STEM subjects.
Analyze the image and extract ALL questions found.
Return ONLY a JSON array of questions, no markdown, even if there is only one question.

Each question must follow this format:
{
  "type": "open" | "multiple_choice" | "true_false" | "fill_blank" | "matching" | "essay",
  "statement": "question text (use $ delimiters for inline LaTeX)",
  "options": [{"key":"a","text":"...","is_correct":false}],  // only for multiple_choice
  "answer": true,                                              // only for true_false
  "blanks": {"1":"answer"},                                    // only for fill_blank
  "left": [{"key":"1","text":"..."}],                         // only for matching
  "right": [{"key":"a","text":"..."}],                        // only for matching
  "pairs": {"1":"a"},                                         // only for matching
  "answerLines": 3,                                            // for open/essay
  "sampleAnswer": "",                                          // for open
  "has_math": false
}

Return: [{ question1 }, { question2 }, ...]`;

  const result = await model.generateContent([
    { inlineData: { mimeType: input.mimeType, data: input.fileBase64 } },
    prompt,
  ]);

  const raw = safeJson(extractText(result));
  if (Array.isArray(raw)) {
    return (raw as Record<string, unknown>[]).map(parseQuestionJson);
  }
  // Fallback: single question object returned instead of array
  return [parseQuestionJson(raw as Record<string, unknown>)];
}

// ─── Generate questions ───────────────────────────────────────────────────────

export async function generateQuestions(input: GenerateQuestionsInput): Promise<QuestionContent[]> {
  const model = getModel();
  const typesList = input.types.join(", ");
  const difficultyStr = input.difficulty ? `Difficulty: ${input.difficulty}.` : "";
  const gradeStr = input.gradeLevel ? `Grade level: ${input.gradeLevel}.` : "";

  const prompt = `You are an experienced SAT/AP STEM educator creating high-quality questions in English.
Create ${input.count} question(s) about: "${input.topic}".
Accepted types: ${typesList}. ${difficultyStr} ${gradeStr}
Return ONLY a JSON array of questions, no markdown.

Each object must include:
{
  "type": "open" | "multiple_choice" | "true_false" | "fill_blank" | "matching" | "essay",
  "statement": "question text ($ for LaTeX)",
  // additional fields by type (same schema as extractQuestions)
}`;

  const result = await model.generateContent(prompt);
  const raw = safeJson(extractText(result));
  if (!Array.isArray(raw)) throw new Error("Invalid AI response");
  return (raw as Record<string, unknown>[]).map(parseQuestionJson);
}

// ─── Generate full sheet ──────────────────────────────────────────────────────

export async function generateSheet(input: GenerateSheetInput): Promise<GenerateSheetResult> {
  const model = getModel();
  const topicsStr = input.topics.join(", ");
  const typesStr = input.types.join(", ");
  const diffStr = input.difficulty ? `difficulty: ${input.difficulty}` : "";

  const prompt = `You are an experienced SAT/AP STEM educator creating a complete ${input.examType ?? "test"} in English.
Subject: ${input.subject}. Grade level: ${input.gradeLevel}. Topics: ${topicsStr}.
Create ${input.questionCount} questions of types: ${typesStr}. ${diffStr}
Return ONLY JSON: {"title":"...","questions":[...],"suggestedPoints":10}
Each question follows the same format as generateQuestions.`;

  const result = await model.generateContent(prompt);
  const raw = safeJson(extractText(result)) as Record<string, unknown>;

  return {
    title: String(raw.title ?? input.title),
    questions: Array.isArray(raw.questions)
      ? (raw.questions as Record<string, unknown>[]).map(parseQuestionJson)
      : [],
    suggestedPoints: Number(raw.suggestedPoints ?? 10),
  };
}

// ─── Classify subject/topic ───────────────────────────────────────────────────

export async function classifySubject(statement: string): Promise<ClassifyResult> {
  const model = getModel();
  const prompt = `Classify the following SAT/AP STEM question.
Return ONLY JSON: {"subjectName":"Mathematics","topicName":"Algebra","difficulty":"easy"|"medium"|"hard","confidence":0.9}

Question: "${statement.slice(0, 500)}"`;

  const result = await model.generateContent(prompt);
  const raw = safeJson(extractText(result)) as Record<string, unknown>;

  return {
    subjectName: typeof raw.subjectName === "string" ? raw.subjectName : null,
    topicName: typeof raw.topicName === "string" ? raw.topicName : null,
    difficulty: (["easy", "medium", "hard"].includes(String(raw.difficulty))
      ? raw.difficulty
      : null) as Difficulty | null,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.5,
  };
}

// ─── Co-author transformation ─────────────────────────────────────────────────

export async function transformQuestion(
  content: QuestionContent,
  action: CoauthorAction,
): Promise<CoauthorResult> {
  const model = getModel();

  const instructions: Record<CoauthorAction, string> = {
    harder: "Make the question harder while keeping the same type and subject.",
    easier: "Simplify the question without changing its type.",
    distractor: "For MCQ: improve the distractors to be plausible but clearly incorrect. For other types, suggest a variation with an effective distractor.",
    simplify_language: "Rewrite in simpler, more accessible language suitable for students with dyslexia or reading difficulties. Preserve the content.",
    check_ambiguity: "Analyze the question and return an ambiguity report. If none, state it is clear. Return {\"type\":\"open\",\"statement\":\"report\",\"answerLines\":0,\"sampleAnswer\":\"\"}",
    worked_solution: "Create a detailed worked solution. Return {\"type\":\"open\",\"statement\":\"Worked solution\",\"answerLines\":0,\"sampleAnswer\":\"solution here\"}",
    variations: "Create a variation of the question with different numbers/names/context but the same structure.",
  };

  const prompt = `You are a co-author for SAT/AP STEM content, writing in English.
Instruction: ${instructions[action]}
Return ONLY the resulting question JSON (same format: {type, statement, ...}).

Original question: ${JSON.stringify(content)}`;

  const result = await model.generateContent(prompt);
  const raw = safeJson(extractText(result)) as Record<string, unknown>;

  return { action, result: parseQuestionJson(raw) };
}

// ─── JSON → QuestionContent parser ───────────────────────────────────────────

function parseQuestionJson(raw: Record<string, unknown>): QuestionContent {
  const type = String(raw.type ?? "open") as QuestionType;
  const statement = String(raw.statement ?? "");

  switch (type) {
    case "multiple_choice": {
      const opts = Array.isArray(raw.options) ? (raw.options as McqOption[]) : [];
      if (opts.length === 0) {
        return {
          type: "open",
          statement,
          answerLines: 3,
          sampleAnswer: "",
        };
      }
      return { type: "multiple_choice", statement, options: opts };
    }
    case "true_false":
      return { type: "true_false", statement, answer: raw.answer === true };
    case "fill_blank": {
      const blanks = (raw.blanks ?? {}) as Record<string, string>;
      const stmt = statement.includes("{{") ? statement : statement + " ({{1}})";
      return { type: "fill_blank", statement: stmt, blanks };
    }
    case "matching": {
      const left = Array.isArray(raw.left) ? (raw.left as MatchingItem[]) : [];
      const right = Array.isArray(raw.right) ? (raw.right as MatchingItem[]) : [];
      const pairs = (raw.pairs ?? {}) as Record<string, string>;
      return { type: "matching", statement, left, right, pairs };
    }
    case "essay":
      return {
        type: "essay",
        statement,
        answerLines: typeof raw.answerLines === "number" ? raw.answerLines : 8,
      };
    default:
      return {
        type: "open",
        statement,
        answerLines: typeof raw.answerLines === "number" ? raw.answerLines : 3,
        sampleAnswer: typeof raw.sampleAnswer === "string" ? raw.sampleAnswer : "",
      };
  }
}
