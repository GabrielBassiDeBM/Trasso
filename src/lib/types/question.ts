import type { Json, QuestionType, StatementFormat } from "@/lib/types/database";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  open: "Short Answer",
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill in the Blank",
  matching: "Matching",
  essay: "Essay",
};

export const QUESTION_TYPES: QuestionType[] = [
  "open",
  "multiple_choice",
  "true_false",
  "fill_blank",
  "matching",
  "essay",
];

export interface McqOption {
  key: string;
  text: string;
  is_correct: boolean;
}

export interface MatchingItem {
  key: string;
  text: string;
}

/** In-editor representation of a question, independent of its DB jsonb encoding. */
export type QuestionContent =
  | { type: "open"; statement: string; answerLines: number; sampleAnswer: string }
  | { type: "multiple_choice"; statement: string; options: McqOption[] }
  | { type: "true_false"; statement: string; answer: boolean }
  | { type: "fill_blank"; statement: string; blanks: Record<string, string> }
  | {
      type: "matching";
      statement: string;
      left: MatchingItem[];
      right: MatchingItem[];
      pairs: Record<string, string>;
    }
  | { type: "essay"; statement: string; answerLines: number };

const LETTERS = ["a", "b", "c", "d", "e", "f"];

export function defaultContentForType(type: QuestionType): QuestionContent {
  switch (type) {
    case "open":
      return { type, statement: "", answerLines: 3, sampleAnswer: "" };
    case "multiple_choice":
      return {
        type,
        statement: "",
        options: LETTERS.slice(0, 4).map((key) => ({ key, text: "", is_correct: false })),
      };
    case "true_false":
      return { type, statement: "", answer: true };
    case "fill_blank":
      return { type, statement: "The capital of France is {{1}}.", blanks: { "1": "" } };
    case "matching":
      return {
        type,
        statement: "",
        left: [{ key: "1", text: "" }],
        right: [{ key: "a", text: "" }],
        pairs: {},
      };
    case "essay":
      return { type, statement: "", answerLines: 8 };
  }
}

/** Detects inline LaTeX delimited by $...$ or $$...$$. */
export function detectHasMath(text: string): boolean {
  return /\$\$?[^$]+\$\$?/.test(text);
}

interface QuestionDbColumns {
  statement: string;
  statement_format: StatementFormat;
  type: QuestionType;
  options: Json | null;
  answer: Json | null;
  has_math: boolean;
}

/** Maps in-editor content to the columns stored on `questions`. */
export function toDbColumns(content: QuestionContent): QuestionDbColumns {
  const base = {
    statement: content.statement,
    statement_format: "plain" as StatementFormat,
    has_math: detectHasMath(content.statement),
  };

  switch (content.type) {
    case "open":
      return {
        ...base,
        type: content.type,
        options: null,
        answer: { lines: content.answerLines, sample_answer: content.sampleAnswer },
      };
    case "multiple_choice":
      return {
        ...base,
        type: content.type,
        options: content.options as unknown as Json,
        answer: { correct_keys: content.options.filter((o) => o.is_correct).map((o) => o.key) },
        has_math: base.has_math || content.options.some((o) => detectHasMath(o.text)),
      };
    case "true_false":
      return { ...base, type: content.type, options: null, answer: { value: content.answer } };
    case "fill_blank":
      return {
        ...base,
        type: content.type,
        options: null,
        answer: { blanks: content.blanks as unknown as Json },
      };
    case "matching":
      return {
        ...base,
        type: content.type,
        options: { left: content.left, right: content.right } as unknown as Json,
        answer: { pairs: content.pairs as unknown as Json },
      };
    case "essay":
      return {
        ...base,
        type: content.type,
        options: null,
        answer: { lines: content.answerLines },
      };
  }
}

interface QuestionRowLike {
  type: QuestionType;
  statement: string;
  options: Json | null;
  answer: Json | null;
}

/** Maps DB columns back to in-editor content. */
export function fromDbRow(row: QuestionRowLike): QuestionContent {
  const answer = (row.answer ?? {}) as Record<string, unknown>;
  const options = row.options as unknown;

  switch (row.type) {
    case "open":
      return {
        type: "open",
        statement: row.statement,
        answerLines: typeof answer.lines === "number" ? answer.lines : 3,
        sampleAnswer: typeof answer.sample_answer === "string" ? answer.sample_answer : "",
      };
    case "multiple_choice":
      return {
        type: "multiple_choice",
        statement: row.statement,
        options: Array.isArray(options) ? (options as McqOption[]) : [],
      };
    case "true_false":
      return {
        type: "true_false",
        statement: row.statement,
        answer: answer.value === true,
      };
    case "fill_blank":
      return {
        type: "fill_blank",
        statement: row.statement,
        blanks: (answer.blanks as Record<string, string>) ?? {},
      };
    case "matching": {
      const opts = (options ?? {}) as { left?: MatchingItem[]; right?: MatchingItem[] };
      return {
        type: "matching",
        statement: row.statement,
        left: opts.left ?? [],
        right: opts.right ?? [],
        pairs: (answer.pairs as Record<string, string>) ?? {},
      };
    }
    case "essay":
      return {
        type: "essay",
        statement: row.statement,
        answerLines: typeof answer.lines === "number" ? answer.lines : 8,
      };
  }
}
