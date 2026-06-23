import { z } from "zod";

const QUESTION_TYPE = z.enum(["open", "multiple_choice", "true_false", "fill_blank", "matching", "essay"]);
const DIFFICULTY = z.enum(["easy", "medium", "hard"]);

// Free-text fields that get interpolated into AI prompts: capped hard so a
// single request can't blow up token usage/cost, and newlines/control chars
// stripped so the text can't masquerade as additional prompt instructions.
const promptText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((s) => s.replace(/[\r\n\t]+/g, " "));

export const generateQuestionsSchema = z
  .object({
    topic: promptText(300),
    count: z.number().int().min(1).max(20),
    types: z.array(QUESTION_TYPE).min(1).max(6),
    difficulty: DIFFICULTY.optional(),
    gradeLevel: promptText(60).optional(),
    bnccCode: promptText(40).optional(),
  })
  .strict();

export const generateSheetSchema = z
  .object({
    title: promptText(150),
    subject: promptText(150),
    gradeLevel: promptText(60),
    topics: z.array(promptText(150)).max(20),
    questionCount: z.number().int().min(1).max(40),
    types: z.array(QUESTION_TYPE).min(1).max(6),
    difficulty: DIFFICULTY.optional(),
    examType: promptText(40).optional(),
  })
  .strict();

export const classifySchema = z
  .object({
    statement: promptText(2000),
  })
  .strict();

const questionContentSchema = z.looseObject({ type: QUESTION_TYPE, statement: z.string().max(5000) });

export const coauthorSchema = z
  .object({
    content: questionContentSchema,
    action: z.enum([
      "harder",
      "easier",
      "distractor",
      "simplify_language",
      "check_ambiguity",
      "worked_solution",
      "variations",
    ]),
  })
  .strict();

// Base64 inflates size by ~4/3; 8 MB of base64 text is ~6 MB of binary, a
// reasonable ceiling for a scanned question image/page.
export const MAX_SCAN_BASE64_CHARS = 8 * 1024 * 1024;
const ALLOWED_SCAN_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/heic"]);

export const scanQuestionSchema = z
  .object({
    fileBase64: z
      .string()
      .min(1)
      .max(MAX_SCAN_BASE64_CHARS)
      .regex(/^[A-Za-z0-9+/]+=*$/, "fileBase64 must be valid base64"),
    mimeType: z.string().refine((v) => ALLOWED_SCAN_MIME_TYPES.has(v), {
      message: "Unsupported file type",
    }),
  })
  .strict();
