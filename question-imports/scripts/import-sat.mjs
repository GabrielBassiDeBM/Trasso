#!/usr/bin/env node
// Imports SAT prep PDFs from "fontes sat.zip" into the public question bank.
// Usage:
//   node question-imports/scripts/import-sat.mjs --folder "sat 1"
//   node question-imports/scripts/import-sat.mjs --file "fontes sat/sat 1/45 Math questions by Shoks.pdf"
//   node question-imports/scripts/import-sat.mjs --all
//
// Resumable: progress is persisted to .import-progress.json next to this script's
// parent dir (question-imports/). Re-running skips finished files and known-duplicate
// question hashes.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // question-imports/
const ZIP_PATH = path.join(ROOT, "fontes sat.zip");
const PROGRESS_PATH = path.join(ROOT, ".import-progress.json");
const LOG_PATH = path.join(ROOT, "import-log.ndjson");

const SUBJECT_IDS = {
  math: "10000000-0000-0000-0000-000000000001",
  reading_writing: "10000000-0000-0000-0000-000000000015",
};

const PAGES_PER_CHUNK = 15;
const INSERT_BATCH_SIZE = 50;

// Filenames (case-insensitive substring match) that are reference material with
// no actual questions inside — skipped without spending an API call on them.
const NON_QUESTION_PATTERNS = [
  "formula list",
  "most important words",
  "extracurricular activities",
  "premium book", // vocab/grammar reference books, not question sets
];

// ─── env ────────────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = path.join(ROOT, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set (check .env.local).");
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase URL / service role key not set.");

const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ─── progress / log ─────────────────────────────────────────────────────────

function loadProgress() {
  if (!existsSync(PROGRESS_PATH)) return { doneFiles: {}, questionHashes: {} };
  return JSON.parse(readFileSync(PROGRESS_PATH, "utf8"));
}
function saveProgress(progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}
function log(entry) {
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

// ─── zip listing / extraction (no full unzip to disk) ──────────────────────

function listZipEntries() {
  const res = spawnSync("unzip", ["-l", ZIP_PATH], { maxBuffer: 1024 * 1024 * 64, encoding: "utf8" });
  if (res.status !== 0) throw new Error(`unzip -l failed: ${res.stderr}`);
  const lines = res.stdout.split("\n").slice(3, -3);
  const entries = [];
  for (const line of lines) {
    const m = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)$/);
    if (!m) continue;
    const size = Number(m[1]);
    const name = m[2];
    if (name.endsWith("/")) continue;
    entries.push({ name, size });
  }
  return entries;
}

function extractEntry(entryName) {
  const res = spawnSync("unzip", ["-p", ZIP_PATH, entryName], {
    maxBuffer: 1024 * 1024 * 1024,
    encoding: "buffer",
  });
  if (res.status !== 0) throw new Error(`unzip -p failed for ${entryName}: ${res.stderr}`);
  return res.stdout;
}

function isSkippableNonQuestion(name) {
  const lower = name.toLowerCase();
  return NON_QUESTION_PATTERNS.some((p) => lower.includes(p));
}

// ─── Gemini extraction ──────────────────────────────────────────────────────

async function uploadToGemini(buffer, displayName, mimeType) {
  const { file } = await fileManager.uploadFile(buffer, { mimeType, displayName });
  let info = file;
  while (info.state === FileState.PROCESSING) {
    await new Promise((r) => setTimeout(r, 3000));
    info = await fileManager.getFile(file.name);
  }
  if (info.state !== FileState.ACTIVE) {
    throw new Error(`Gemini file processing failed: ${info.state} (${info.error?.message ?? ""})`);
  }
  return info;
}

function buildPrompt(startPage, endPage) {
  return `You are building a SAT practice question bank. The attached document is SAT prep
material (may include real exam content). Look ONLY at pages ${startPage}-${endPage}.

For every genuine SAT-style question you find in that page range, produce a REWRITTEN,
PARAPHRASED version — same underlying concept, skill, and difficulty, but reworded statement
and, for math, changed surface numbers/names. Do NOT copy sentences verbatim from the source.
Skip anything that isn't actually a question (word lists, formula references, instructions,
cover pages, answer keys with no question text attached).

For figure-dependent questions (a chart, graph, table, or geometric figure is required to
answer), do not try to describe the original image. Instead include a "figure" field with
EITHER {"kind":"table","markdown":"<markdown table>"} OR
{"kind":"chart","chartType":"line"|"bar"|"scatter","series":[{"label":"...","points":[[x,y],...]}],"xLabel":"...","yLabel":"..."}.
If the figure is a photo/complex diagram that can't be represented this way, omit the question
entirely and instead add its gist to a top-level "skippedFigures" array of short strings.

Return ONLY minified JSON, no markdown fences, matching this shape:
{
  "questions": [
    {
      "section": "math" | "reading_writing",
      "topic": "short topic name, e.g. Heart of Algebra / Craft and Structure",
      "difficulty": "easy" | "medium" | "hard",
      "type": "multiple_choice" | "open",
      "statement": "question text, markdown, $..$ for inline LaTeX",
      "options": [{"key":"a","text":"...","is_correct":false}, ...],
      "correctAnswer": "text answer if type is open, else null",
      "solution": "worked explanation of how to reach the answer",
      "hasMath": false,
      "figure": null
    }
  ],
  "skippedFigures": []
}`;
}

async function extractChunk(fileInfo, startPage, endPage) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
  });
  const result = await model.generateContent([
    { fileData: { fileUri: fileInfo.uri, mimeType: fileInfo.mimeType } },
    buildPrompt(startPage, endPage),
  ]);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned);
  }
}

// ─── classification helpers ─────────────────────────────────────────────────

let topicsCache = null;
async function getTopics() {
  if (topicsCache) return topicsCache;
  const { data, error } = await supabase.from("topics").select("id, subject_id, name");
  if (error) throw error;
  topicsCache = data;
  return data;
}

async function matchTopic(subjectId, topicName) {
  if (!topicName) return null;
  const topics = await getTopics();
  const lower = topicName.toLowerCase();
  const candidates = topics.filter((t) => t.subject_id === subjectId);
  const exact = candidates.find((t) => t.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = candidates.find(
    (t) => lower.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(lower),
  );
  return partial ? partial.id : null;
}

function detectHasMath(text) {
  return /\$\$?[^$]+\$\$?/.test(text ?? "");
}

function normalizeForHash(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hashStatement(text) {
  return createHash("sha256").update(normalizeForHash(text)).digest("hex");
}

// ─── figure rendering (simple SVG -> data URL, no native deps) ─────────────

function renderFigureSvg(figure) {
  const W = 480, H = 320, PAD = 40;
  if (figure.kind === "table") return null; // tables render fine as markdown directly
  if (figure.kind !== "chart") return null;

  const allPoints = figure.series.flatMap((s) => s.points);
  if (allPoints.length === 0) return null;
  const xs = allPoints.map((p) => p[0]);
  const ys = allPoints.map((p) => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const sx = (x) => PAD + ((x - xMin) / (xMax - xMin || 1)) * (W - 2 * PAD);
  const sy = (y) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);

  const colors = ["#2563eb", "#dc2626", "#16a34a", "#d97706"];
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#fff">`,
  );
  parts.push(`<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#333"/>`);
  parts.push(`<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="#333"/>`);

  figure.series.forEach((series, i) => {
    const color = colors[i % colors.length];
    if (figure.chartType === "bar") {
      const bw = (W - 2 * PAD) / series.points.length / 1.6;
      series.points.forEach(([x, y]) => {
        const px = sx(x);
        parts.push(
          `<rect x="${px - bw / 2}" y="${sy(y)}" width="${bw}" height="${H - PAD - sy(y)}" fill="${color}"/>`,
        );
      });
    } else if (figure.chartType === "scatter") {
      series.points.forEach(([x, y]) => parts.push(`<circle cx="${sx(x)}" cy="${sy(y)}" r="3" fill="${color}"/>`));
    } else {
      const pts = series.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
      parts.push(`<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/>`);
    }
  });
  parts.push("</svg>");
  return parts.join("");
}

async function uploadFigureSvg(svg, hash) {
  const storagePath = `sat-import/${hash}.svg`;
  const { error } = await supabase.storage
    .from("question-images")
    .upload(storagePath, Buffer.from(svg), { contentType: "image/svg+xml", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("question-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── question -> DB row ─────────────────────────────────────────────────────

async function buildRow(q, source, tags) {
  const subjectId = SUBJECT_IDS[q.section];
  if (!subjectId) return null;

  let statement = String(q.statement ?? "").trim();
  if (!statement) return null;

  if (q.figure) {
    if (q.figure.kind === "table" && q.figure.markdown) {
      statement += `\n\n${q.figure.markdown}`;
    } else if (q.figure.kind === "chart") {
      const svg = renderFigureSvg(q.figure);
      if (svg) {
        const hash = hashStatement(statement).slice(0, 16);
        const url = await uploadFigureSvg(svg, hash);
        statement += `\n\n![figure](${url})`;
      }
    }
  }

  const type = q.type === "multiple_choice" ? "multiple_choice" : "open";
  const hasMath = Boolean(q.hasMath) || detectHasMath(statement);

  const base = {
    statement,
    statement_format: "markdown",
    has_math: hasMath,
    owner_id: null,
    is_public: true,
    subject_id: subjectId,
    topic_id: await matchTopic(subjectId, q.topic),
    difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : null,
    source,
    tags,
    solution: typeof q.solution === "string" && q.solution.trim() ? q.solution.trim() : null,
    solution_format: "markdown",
  };

  if (type === "multiple_choice") {
    const options = Array.isArray(q.options) ? q.options : [];
    if (options.length === 0) {
      return {
        ...base,
        type: "open",
        options: null,
        answer: { lines: 3, sample_answer: q.correctAnswer ?? "" },
      };
    }
    return {
      ...base,
      type: "multiple_choice",
      options,
      answer: { correct_keys: options.filter((o) => o.is_correct).map((o) => o.key) },
    };
  }

  return {
    ...base,
    type: "open",
    options: null,
    answer: { lines: 3, sample_answer: q.correctAnswer ?? "" },
  };
}

// ─── insert a hand-extracted batch of questions (manual extraction path) ──

async function insertQuestions(questions, source, folder, progress) {
  const tags = ["sat-import", folder];
  let inserted = 0, skippedDup = 0;
  const rows = [];

  for (const q of questions) {
    const hash = hashStatement(q.statement);
    if (progress.questionHashes[hash]) {
      skippedDup++;
      continue;
    }
    const row = await buildRow(q, source, tags);
    if (!row) continue;
    progress.questionHashes[hash] = true;
    rows.push(row);
  }

  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
    const { error } = await supabase.from("questions").insert(batch);
    if (error) {
      log({ file: source, event: "insert_error", message: error.message });
      console.error(`  insert error: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  saveProgress(progress);
  log({ file: source, event: "manual_insert_done", inserted, skippedDup });
  console.log(`[done] ${source}: inserted=${inserted} dup=${skippedDup}`);
  return { inserted, skippedDup };
}

// ─── per-file processing ────────────────────────────────────────────────────

async function processFile(entry, folder, progress) {
  if (progress.doneFiles[entry.name]) {
    console.log(`[skip:done] ${entry.name}`);
    return;
  }
  if (isSkippableNonQuestion(entry.name)) {
    log({ file: entry.name, event: "skipped_non_question" });
    progress.doneFiles[entry.name] = { skipped: "non_question" };
    saveProgress(progress);
    console.log(`[skip:non-question] ${entry.name}`);
    return;
  }
  const ext = path.extname(entry.name).toLowerCase();
  if (ext !== ".pdf") {
    log({ file: entry.name, event: "skipped_unsupported_format" });
    progress.doneFiles[entry.name] = { skipped: "unsupported_format" };
    saveProgress(progress);
    console.log(`[skip:format] ${entry.name}`);
    return;
  }

  console.log(`[extract] ${entry.name} (${(entry.size / 1e6).toFixed(1)} MB)`);
  const buffer = extractEntry(entry.name);

  let pageCount;
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pageCount = doc.getPageCount();
  } catch (err) {
    log({ file: entry.name, event: "error", stage: "page_count", message: String(err) });
    progress.doneFiles[entry.name] = { skipped: "unreadable_pdf" };
    saveProgress(progress);
    console.log(`[skip:unreadable] ${entry.name}`);
    return;
  }

  console.log(`[upload] ${entry.name} -> Gemini (${pageCount} pages)`);
  const fileInfo = await uploadToGemini(buffer, path.basename(entry.name), "application/pdf");

  const tags = ["sat-import", folder];
  let inserted = 0, skippedDup = 0, skippedFigures = 0;

  for (let start = 1; start <= pageCount; start += PAGES_PER_CHUNK) {
    const end = Math.min(start + PAGES_PER_CHUNK - 1, pageCount);
    try {
      const result = await extractChunk(fileInfo, start, end);
      const questions = Array.isArray(result.questions) ? result.questions : [];
      skippedFigures += Array.isArray(result.skippedFigures) ? result.skippedFigures.length : 0;

      const rows = [];
      for (const q of questions) {
        const hash = hashStatement(q.statement);
        if (progress.questionHashes[hash]) {
          skippedDup++;
          continue;
        }
        const row = await buildRow(q, entry.name, tags);
        if (!row) continue;
        progress.questionHashes[hash] = true;
        rows.push(row);
      }

      for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
        const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
        const { error } = await supabase.from("questions").insert(batch);
        if (error) {
          log({ file: entry.name, event: "insert_error", message: error.message, pages: [start, end] });
        } else {
          inserted += batch.length;
        }
      }
      saveProgress(progress);
      console.log(`  pages ${start}-${end}: +${rows.length} questions (running total ${inserted})`);
    } catch (err) {
      log({ file: entry.name, event: "error", stage: "extract_chunk", pages: [start, end], message: String(err) });
      console.log(`  pages ${start}-${end}: ERROR ${err.message}`);
    }
  }

  await fileManager.deleteFile(fileInfo.name).catch(() => {});

  log({ file: entry.name, event: "file_done", inserted, skippedDup, skippedFigures });
  progress.doneFiles[entry.name] = { inserted, skippedDup, skippedFigures };
  saveProgress(progress);
  console.log(`[done] ${entry.name}: inserted=${inserted} dup=${skippedDup} skippedFigures=${skippedFigures}`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const folderArg = args.includes("--folder") ? args[args.indexOf("--folder") + 1] : null;
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
  const all = args.includes("--all");
  const insertJsonArg = args.includes("--insert-json") ? args[args.indexOf("--insert-json") + 1] : null;

  if (insertJsonArg) {
    // Manual extraction path: a JSON file of { source, folder, questions: [...] }
    // already paraphrased/classified by hand (no Gemini call involved).
    const payload = JSON.parse(readFileSync(insertJsonArg, "utf8"));
    const progress = loadProgress();
    const result = await insertQuestions(payload.questions, payload.source, payload.folder, progress);
    progress.doneFiles[payload.source] = { ...(progress.doneFiles[payload.source] ?? {}), ...result };
    saveProgress(progress);
    console.log("Manual insert complete.");
    return;
  }

  if (!folderArg && !fileArg && !all) {
    console.error(
      'Usage: --folder "sat 1" | --file "fontes sat/sat 1/x.pdf" | --all | --insert-json path/to/questions.json',
    );
    process.exit(1);
  }

  console.log("Listing zip entries...");
  const entries = listZipEntries();
  console.log(`Found ${entries.length} files in zip.`);

  let targets;
  if (fileArg) {
    targets = entries.filter((e) => e.name === fileArg);
  } else if (folderArg) {
    const prefix = `fontes sat/${folderArg}/`;
    targets = entries.filter((e) => e.name.startsWith(prefix));
  } else {
    targets = entries;
  }
  console.log(`${targets.length} target file(s) to process.`);

  const progress = loadProgress();

  for (const entry of targets) {
    const folder = entry.name.split("/")[1] ?? "unknown";
    try {
      await processFile(entry, folder, progress);
    } catch (err) {
      log({ file: entry.name, event: "fatal_error", message: String(err?.stack ?? err) });
      console.error(`[FATAL] ${entry.name}:`, err);
    }
  }

  console.log("All targets processed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
