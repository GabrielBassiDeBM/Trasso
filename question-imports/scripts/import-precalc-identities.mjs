#!/usr/bin/env node
// One-off import of question-imports/precalc_identities_questions.json:
//   1. Inserts the 45 questions into the public bank (questions table).
//   2. Creates a Sheet owned by the given user, with a passage block holding
//      the 27 identities reference, followed by the questions in order.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // question-imports/
const DATA_PATH = path.join(ROOT, "precalc_identities_questions.json");

function loadEnvLocal() {
  const envPath = path.join(ROOT, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase URL / service role key not set.");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SHEET_OWNER_EMAIL = "gbassigames@gmail.com";
const AP_PRECALC_SUBJECT_ID = "10000000-0000-0000-0000-000000000002";

// Must match src/lib/sheets/defaults.ts DEFAULT_COVER_LAYOUT — sheets.cover_layout is
// NOT NULL, and page.tsx's `?? DEFAULT_COVER_LAYOUT` fallback only triggers on null/undefined,
// not on `{}`, so an empty object here crashes CoverDesigner (layout.blocks.find on undefined).
const DEFAULT_COVER_LAYOUT = {
  blocks: [
    { id: "title", type: "title", x: 18, y: 14, w: 174, h: 20, props: { text: "Exam", subtitle: "" } },
    { id: "field-name", type: "student_field", x: 18, y: 40, w: 112, h: 10, props: { label: "Name" } },
    { id: "field-date", type: "student_field", x: 134, y: 40, w: 58, h: 10, props: { label: "Date" } },
    { id: "field-period", type: "student_field", x: 18, y: 54, w: 76, h: 10, props: { label: "Period" } },
    { id: "field-score", type: "score_box", x: 134, y: 54, w: 58, h: 10, props: { label: "Score" } },
    { id: "instructions", type: "instructions", x: 18, y: 72, w: 174, h: 24, props: { text: "Read each question carefully before answering." } },
  ],
};

// AP Precalculus topic names (must match public.topics.name for this subject)
const PRF = "Polynomial and Rational Functions";
const ELF = "Exponential and Logarithmic Functions";
const TPF = "Trigonometric and Polar Functions";

// Map each source question's `topic` field to the closest AP Precalculus unit.
const TOPIC_MAP = {
  Functions: PRF,
  "Domain and range": PRF,
  Inequalities: PRF,
  "Systems of equations": PRF,
  Lines: PRF,
  Quadratics: PRF,
  Factoring: PRF,
  "Rational expressions": PRF,
  "Powers and radicals": PRF,
  Sequences: PRF,
  "Exponentials & logarithms": ELF,
  Trigonometry: TPF,
};

const TAGS = ["precalc-identities-import"];
const SOURCE = "precalc_identities_questions.json";

function hasMath(text) {
  return /\$\$?[^$]+\$\$?/.test(text ?? "");
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));

  const { data: topics, error: topicsErr } = await supabase
    .from("topics")
    .select("id, name")
    .eq("subject_id", AP_PRECALC_SUBJECT_ID);
  if (topicsErr) throw topicsErr;
  const topicIdByName = new Map(topics.map((t) => [t.name, t.id]));
  for (const name of new Set(Object.values(TOPIC_MAP))) {
    if (!topicIdByName.has(name)) throw new Error(`AP Precalculus topic not found: ${name}`);
  }

  const { data: userData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) throw userErr;
  const owner = userData.users.find((u) => u.email === SHEET_OWNER_EMAIL);
  if (!owner) throw new Error(`No auth user with email ${SHEET_OWNER_EMAIL}`);

  // ---- 1. Insert questions into the public bank ----
  const rows = data.questions.map((q) => {
    const mappedTopicName = TOPIC_MAP[q.topic];
    if (!mappedTopicName) throw new Error(`No topic mapping for "${q.topic}" (question id ${q.id})`);
    return {
      statement: q.question,
      statement_format: "markdown",
      type: "open",
      options: null,
      answer: { lines: 3, sample_answer: q.answer },
      subject_id: AP_PRECALC_SUBJECT_ID,
      topic_id: topicIdByName.get(mappedTopicName),
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : null,
      has_math: hasMath(q.question) || hasMath(q.answer),
      owner_id: null,
      is_public: true,
      source: SOURCE,
      tags: [...TAGS, ...(q.topics ?? [])],
      solution: typeof q.solution === "string" && q.solution.trim() ? q.solution.trim() : null,
      solution_format: "markdown",
    };
  });

  const { data: inserted, error: insertErr } = await supabase.from("questions").insert(rows).select("id");
  if (insertErr) throw insertErr;
  console.log(`Inserted ${inserted.length} questions into the public bank.`);

  // ---- 2. Build the identities passage (grouped by category) ----
  const byCategory = new Map();
  for (const ident of data.identities) {
    if (!byCategory.has(ident.category)) byCategory.set(ident.category, []);
    byCategory.get(ident.category).push(ident);
  }
  const passageLines = [];
  for (const [category, idents] of byCategory) {
    passageLines.push(`### ${category}`);
    for (const ident of idents) {
      passageLines.push(`- $${ident.statement}$ — ${ident.note}`);
    }
    passageLines.push("");
  }
  const passage = passageLines.join("\n").trim();

  // ---- 3. Create the sheet ----
  const { data: sheet, error: sheetErr } = await supabase
    .from("sheets")
    .insert({
      owner_id: owner.id,
      title: data.title,
      status: "draft",
      subject_id: AP_PRECALC_SUBJECT_ID,
      subject_ids: [AP_PRECALC_SUBJECT_ID],
      exam_type: "lista",
      page_settings: {},
      cover_layout: DEFAULT_COVER_LAYOUT,
    })
    .select("id")
    .single();
  if (sheetErr) throw sheetErr;
  console.log(`Created sheet ${sheet.id}: "${data.title}"`);

  // ---- 4. Identities passage block (position 0, ahead of all questions) ----
  const { data: group, error: groupErr } = await supabase
    .from("question_groups")
    .insert({
      sheet_id: sheet.id,
      block_type: "passage",
      title: "Identity Reference",
      instructions: data.description,
      passage,
      passage_format: "markdown",
      position: 0,
      level: 1,
    })
    .select("id")
    .single();
  if (groupErr) throw groupErr;

  // ---- 5. Attach the 45 questions to the sheet, in source order ----
  // Questions and question_groups share one position axis (see src/lib/actions/position.ts);
  // the passage block above sits at position 0, so questions start at 1.
  const sheetQuestionRows = inserted.map((row, i) => ({
    sheet_id: sheet.id,
    question_id: row.id,
    position: i + 1,
  }));
  const { error: sqErr } = await supabase.from("sheet_questions").insert(sheetQuestionRows);
  if (sqErr) throw sqErr;

  console.log(`Linked ${sheetQuestionRows.length} questions to the sheet.`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
