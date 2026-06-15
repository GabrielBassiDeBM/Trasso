# Exercise Sheet Platform — Build Handoff for Claude Code

> **Working name:** _TBD_ (see options at the end). The product builds printable exam / worksheet PDFs ("listas de exercícios", "provas") the way Canva + Google Forms + a question bank would — but purpose-built for teachers, and outputting a clean PDF.

---

## 0. How to use this document (read first, Claude Code)

You are building this app **in phases**. Before writing code:

1. **Read and follow the design skill** at `/mnt/skills/public/frontend-design/SKILL.md` for all UI. Every screen should look intentional, not templated.
2. **Produce a build plan** from this doc: confirm the stack, scaffold the repo, list tasks per phase, and flag anything ambiguous back to the user.
3. **Build phase by phase** (Section 9). Each phase should be independently deployable and demoable.
4. **Security from day one:** secrets stay server-side, Row Level Security (RLS) on every table from the first migration.
5. **Defaults are Brazilian:** UI language `pt-BR`, page size **A4**, equations in LaTeX, BNCC-aligned subject taxonomy.

Do not skip the planning step. Confirm the plan with the user before implementing Phase 1.

---

## 1. What we're building

A web app where a teacher can:

- Create a question sheet by **typing questions**, **importing from a screenshot** (AI reads it), **pulling from a question bank**, or **asking the AI to generate** questions on a topic.
- Support multiple question types: **open answer, multiple choice, true/false, fill-in-the-blank, matching, essay**.
- Write **math equations** like LaTeX, rendered live and in the PDF.
- **Design the layout**: a free-form cover page (title, student info fields, logo, instructions, score box) and a body that flows questions across pages (1 or 2 columns, numbering, answer space).
- **Export a PDF**.
- **Sign in and save** their sheets and their own questions; reuse them later.

The whole thing runs **$0 as a prototype**: Next.js on Vercel (Hobby), Supabase (free), and a **free-tier LLM API** (Gemini Flash) for the AI features — swappable to Claude later via one provider module. See Section 8 for where costs eventually appear.

---

## 2. Tech stack (pinned choices)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Actions + Route Handlers for backend logic. |
| Styling | **Tailwind CSS** | Follow the frontend-design skill for the design system. |
| Hosting | **Vercel** | Hobby tier for build/validation. See Section 8 on the commercial-use caveat. |
| DB / Auth / Storage | **Supabase** (Postgres + Auth + Storage) | RLS everywhere. pgvector available for later. |
| AI (prototype) | **Free-tier LLM API** — default **Google Gemini Flash** (AI Studio) | $0. Multimodal (reads screenshots directly), ~1,500 req/day, no card. See Section 5. |
| AI (optional OCR) | **`tesseract.js`** (browser OCR) | Free, runs client-side. Only needed if you want to keep images off third parties / conserve API quota. |
| AI (later / production) | **Claude API** (Anthropic) | Swap in via the provider layer (Section 5) for higher quality + privacy when it's a real product. |
| AI text speed | **Groq** (free tier) | Optional. Very fast, text-only, ~30 RPM. Good for the text-structuring + subject-tagging steps. |
| Math input | **MathLive** | WYSIWYG math field that outputs LaTeX. |
| Math rendering | **KaTeX** | Renders LaTeX in preview and PDF. Fast, no network. |
| PDF (MVP) | **Browser print** (`@media print` CSS + `window.print()`) | Free, perfect KaTeX fidelity, no serverless timeout. |
| PDF (later) | **Headless Chrome** (Puppeteer + `@sparticuz/chromium`) | For pixel-consistent server-rendered PDFs. Needs Vercel Pro for the longer timeout. |
| Drag/resize (cover) | **react-moveable** or **react-rnd** | Positioned, resizable blocks on the cover canvas. |
| Reorder (questions) | **dnd-kit** | Drag to reorder questions in the body list. |

---

## 3. Architecture overview

```
Browser (Next.js client)
  ├── Auth UI  ──────────────► Supabase Auth (session cookie)
  ├── Sheet editor / preview (KaTeX, MathLive)
  ├── Layout editor (react-moveable + dnd-kit)
  └── "Export PDF" → print view → window.print()   [MVP]

Next.js server (Vercel)  — holds all secrets
  ├── Route Handlers / Server Actions
  ├── lib/ai/provider.ts  ← single swappable AI layer (Gemini now, Claude later)
  ├── /api/ai/extract-from-image   → provider.extractQuestion()   (vision)
  ├── /api/ai/generate             → provider.generateQuestions() (generation)
  ├── /api/ai/classify             → provider.classifySubject()   (cheap)
  ├── reads/writes via Supabase (RLS + service role for admin)
  └── records AI usage per user (quota / rate-limit guard)

(optional) Browser
  └── tesseract.js OCR → text only → /api/ai/* (keeps images client-side)

Supabase
  ├── Postgres (sheets, questions, taxonomy, usage) + RLS
  ├── Auth (email/password, magic link, optional Google OAuth)
  └── Storage (logos, screenshots, question images, generated PDFs)
```

**Key principle:** the "AI" is not self-hosted and not hard-wired to one vendor. Every AI call goes through **one provider module** (`lib/ai/provider.ts`) exposing `extractQuestion()`, `generateQuestions()`, and `classifySubject()`. The prototype implements these with a **free-tier API (Gemini Flash)**; switching to Claude later is a one-file change. Keys live only on the server, never in the browser.

---

## 4. Data model (Supabase / Postgres)

Sketch — refine during planning. All `id` are `uuid default gen_random_uuid()`. All user-owned tables get RLS.

```sql
-- user profile (1:1 with auth.users)
profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  institution text,
  locale text default 'pt-BR',
  created_at timestamptz default now()
)

-- a sheet = cover layout + page settings + ordered questions
sheets (
  id uuid primary key,
  owner_id uuid references auth.users not null,
  title text not null,
  status text default 'draft',              -- draft | ready
  page_settings jsonb not null default '{}',-- size:A4, margins, columns, header/footer, numbering style
  cover_layout jsonb not null default '{}', -- positioned blocks: title, student fields, logo, instructions, score box
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- the join: which questions are on a sheet, in what order, with per-sheet tweaks
sheet_questions (
  id uuid primary key,
  sheet_id uuid references sheets on delete cascade not null,
  question_id uuid references questions on delete set null, -- null allowed for inline one-offs
  position int not null,
  points numeric,
  overrides jsonb default '{}'              -- per-sheet edits without mutating the bank question
)

-- the question (private to a user, OR public bank when owner_id is null)
questions (
  id uuid primary key,
  owner_id uuid references auth.users,      -- NULL = public/shared bank (admin-managed)
  statement text not null,
  statement_format text default 'plain',    -- plain | latex | markdown
  type text not null,                       -- open | multiple_choice | true_false | fill_blank | matching | essay
  options jsonb,                            -- for MCQ/matching: [{key, text, is_correct}]
  answer jsonb,                             -- answer key (optional)
  subject_id uuid references subjects,
  topic_id uuid references topics,
  difficulty text,                          -- easy | medium | hard
  has_math boolean default false,
  source text,
  tags text[] default '{}',
  search tsvector,                          -- full-text search index (Portuguese config)
  created_at timestamptz default now()
)

-- hierarchical subject taxonomy (Disciplina → área → tema), BNCC-aligned
subjects ( id uuid primary key, name text not null, parent_id uuid references subjects )
topics   ( id uuid primary key, subject_id uuid references subjects not null, name text not null, bncc_code text )

-- files in Supabase Storage
assets (
  id uuid primary key,
  owner_id uuid references auth.users not null,
  sheet_id uuid references sheets on delete cascade,
  kind text not null,                       -- logo | screenshot | question_image | pdf
  storage_path text not null,
  created_at timestamptz default now()
)

-- AI usage for quota + cost control
ai_usage (
  id uuid primary key,
  owner_id uuid references auth.users not null,
  kind text not null,                       -- extract | generate | classify
  tokens_in int, tokens_out int,
  created_at timestamptz default now()
)

-- (Phase 5, optional) semantic search + dedupe
-- question_embeddings ( question_id uuid primary key references questions, embedding vector(1024) )
```

### RLS policies (write these in the first migration)

- `profiles`, `sheets`, `sheet_questions`, `assets`, `ai_usage`: **owner-only** — `using (owner_id = auth.uid())` for select/insert/update/delete. (For `sheet_questions`, gate via the parent sheet's owner.)
- `questions`: **SELECT** where `owner_id = auth.uid() OR owner_id is null`; **INSERT/UPDATE/DELETE** only where `owner_id = auth.uid()`. The public bank (owner_id null) is seeded/managed with the **service role key**, never user-writable.
- `subjects`, `topics`: **public read**, admin-only write.
- Storage buckets: per-user folder paths, RLS by owner. Serve images via the Storage CDN (CDN-served assets don't count against the bandwidth quota).

> **Supabase 2026 note:** projects created after **May 30, 2026** must add explicit Postgres `GRANT`s for PostgREST (Data API) access on top of RLS. Set these up in the initial migration so queries don't silently fail.

---

## 5. AI features (free-tier first, behind a swappable provider)

All AI runs server-side through **one module, `lib/ai/provider.ts`**, with three functions: `extractQuestion(input)`, `generateQuestions(params)`, `classifySubject(text)`. The route handlers call these — they never call a vendor SDK directly. This is the most important architectural rule in this section: **the prototype uses a free API; production can swap to Claude by editing only this one file.**

- **Default provider (prototype, $0): Google Gemini Flash via AI Studio.** It's multimodal, so it reads screenshots directly — no separate OCR step needed. Free tier is ~1,500 requests/day with no credit card. Note: Gemini's *free* tier may use prompts for training, so don't send sensitive data; the paid tier and Claude do not.
- **Optional OCR path:** if you'd rather keep images off third parties or stretch the free quota, run **`tesseract.js` OCR in the browser** (install the `por` Portuguese data) and send only the extracted *text* to a free text model (**Groq** is fast and free, ~30 RPM). Trade-off: Tesseract is weak on math and messy layouts — prefer the Gemini vision path when equations are involved.
- **Production swap:** implement the same three functions against the **Claude API** (`claude-sonnet-4-6` for vision/generation, `claude-haiku-4-5` for classification) when quality/privacy matter.

Auth-gate every route (verify the Supabase session), guard the free-tier **rate limits** per user (track calls in `ai_usage`), record usage after each call, and **never** expose any provider key to the client.

### 5.1 Extract question from screenshot — `POST /api/ai/extract-from-image` → `provider.extractQuestion()`
- **In:** image (base64 or a Storage URL). With the OCR path, send extracted text instead.
- **Out (strict JSON):**
  ```json
  {
    "statement": "…",
    "statement_latex": "…",     // math transcribed to LaTeX if present
    "type": "open|multiple_choice|true_false|fill_blank|matching|essay",
    "options": [{"key":"a","text":"…"}],
    "detected_subject": "…",
    "detected_topic": "…",
    "has_math": true,
    "confidence": 0.0
  }
  ```
- Prompt for **JSON only** (Gemini supports a structured-output / JSON mode; use it). Parse defensively. Show the result in an **editable review panel** before saving — never auto-commit AI output.

### 5.2 Generate questions — `POST /api/ai/generate` → `provider.generateQuestions()`
- **In:** `{ subject, topic, count, type, difficulty, language:'pt-BR', notes }`.
- **Out:** array of question objects (same schema as above, including answer keys). Stream if `count` is large to stay within Vercel's 10s timeout.
- Always route through the same editable review panel before insert/save.

### 5.3 Classify subject/topic — `POST /api/ai/classify` → `provider.classifySubject()`
- **In:** `{ statement }` (or a batch).
- Give the model the subject/topic taxonomy and have it pick the best match + confidence. Use a cheap/fast model (Gemini Flash-Lite or Groq).
- **Out:** `{ subject_id, topic_id, confidence }`. Cache results; don't re-classify unchanged text. (Phase 5 alternative: pgvector embeddings for similarity-based classification + dedupe.)

### Cost & rate-limit controls
- The prototype is **$0** on free tiers; the real constraint is **rate limits, not money** (e.g. Gemini ~1,500 req/day, Groq ~30 req/min). Per-user usage caps in `ai_usage` keep one user from burning the shared free quota.
- Keep the cheap step (classification) on a small/fast model; reserve the multimodal model for the screenshot read and generation.
- Set sensible output limits; cache and dedupe; batch classification.
- When you move to a paid provider later: consider **BYOK (bring-your-own-key)** so heavy users cover their own cost — a good fit for a bootstrapped product.

---

## 6. PDF / rendering pipeline

The document model is **structured JSON → HTML → PDF**. KaTeX renders math in both the live preview and the PDF.

- **Phase 1 (MVP):** "Export PDF" opens a clean **print view** (the sheet rendered as print-CSS HTML) and calls `window.print()`; the user saves as PDF. Free, no server, perfect math, WYSIWYG. Use `@page` rules, `break-inside: avoid` on questions, and `@media print` to hide the editor chrome.
- **Phase 5 (fidelity):** server-side **Puppeteer + `@sparticuz/chromium`** render the same HTML to a PDF, store it in Supabase Storage, and return a download link — for consistent output regardless of the user's browser and for batch/programmatic naming. This needs a longer function timeout than Hobby's 10s (see Section 8), so it lands when the project moves to Vercel Pro.

> Why HTML-based and not `react-pdf`/`pdfmake`: those don't render HTML/MathML, so LaTeX math becomes painful. HTML + KaTeX keeps math, flowing content, and pagination all in one well-supported path.

---

## 7. Layout editor spec

Two distinct surfaces because the cover is fixed-position and the body is flowing content:

**Page settings** (applies to the whole sheet): size (A4 default), margins, body columns (1 or 2), header/footer toggles, question numbering style, default answer-line space for open questions, MCQ option style (lettered / bubbles).

**Cover / first-page designer** — free-form canvas (react-moveable / react-rnd). Draggable, resizable blocks stored as `{type, x, y, w, h, props}` in `cover_layout`:
- Title / subtitle
- Student info fields the user toggles on: **Nome, Data, Turma, Série, Nº de matrícula, Nota** (each a labeled blank line/box)
- **Logo** image (upload → Supabase Storage)
- Instructions box, score/grade box

**Body / middle pages** — questions flow into the content region and auto-paginate. Reorder via dnd-kit. Per-question: points, answer space, show/hide options. Respect column setting and keep a question from splitting awkwardly across a page (`break-inside: avoid`).

---

## 8. Hosting reality & cost (be honest with the user)

What's genuinely free, and where it isn't:

- **Supabase free tier:** 500 MB Postgres, 1 GB file storage, 5 GB egress/month, 50,000 monthly active users, 2 active projects. **No commercial-use restriction.** Caveat: a free project **pauses after 7 days of no activity** (resume from the dashboard, or keep it alive with a scheduled ping). Plenty for an MVP and early real usage.
- **Vercel Hobby (free):** ~100 GB bandwidth/month and a **10-second serverless function timeout**. Two things to know:
  1. **Hobby is personal/non-commercial only.** The moment this is a real product with (especially paying) users, Vercel's terms require **Pro (~$20/seat/month)**. Fine to build and validate on Hobby; budget for Pro at launch. (Alternative if you want to stay free at launch: **Cloudflare Pages**, which allows commercial use — slightly more setup for Next.js.)
  2. The **10s timeout** can be hit by AI calls and PDF generation. Mitigations already in this plan: client-side PDF for the MVP, and streaming for long AI generations. Server-side PDF (Puppeteer) effectively needs the longer timeout on Pro.
- **AI (free-tier API):** the prototype's AI is **$0** on a free tier (Gemini Flash: ~1,500 requests/day, no card). The constraint is **rate limits, not money** — fine for building and demos, not for many concurrent users. Free tiers change often and Gemini's free tier may train on prompts. Swapping to the paid **Claude API** (pay-per-token) later is a one-file change via the provider layer (Section 5).

**Summary:** the entire prototype runs at **$0** — Supabase free + Vercel Hobby + a free-tier AI API. The only spend appears at a real launch: Vercel Pro (~$20/mo) for commercial use, and per-token AI cost *if* you move off the free tier for quality/privacy. Until then, priceless.

---

## 9. Build phases (each independently demoable)

- **Phase 0 — Foundation.** Scaffold Next.js + TS + Tailwind. Supabase clients (browser + server). Auth: signup/login/magic link, `profiles` row on signup. Baseline RLS + grants. Deploy skeleton to Vercel. Apply the frontend-design skill to the app shell + design tokens.
- **Phase 1 — Sheet MVP (end-to-end usable).** Sheet CRUD. Question editor for all types. **MathLive** input + **KaTeX** preview. Live document preview. **Client-side PDF export** via print view. _After this phase the app already does the core job._
- **Phase 2 — Layout editor.** Page settings, cover designer (react-moveable), body layout (columns, numbering, answer space), logo upload to Storage.
- **Phase 3 — Question bank.** Subjects/topics taxonomy (seed a BNCC-aligned set). Browse / filter / Portuguese full-text search. Save-to-bank and pull-into-sheet. Public bank (owner_id null) seeded via service role.
- **Phase 4 — AI.** Build `lib/ai/provider.ts` first (the swappable layer), implemented against **Gemini Flash (free)**. Then the `extract-from-image`, `generate`, `classify` routes + editable review panel. `ai_usage` tracking + per-user rate-limit guards. Auto subject-detection on import. (Optional: `tesseract.js` browser-OCR path.)
- **Phase 5 — Polish & scale.** Server-side PDF (Puppeteer) for fidelity + stored PDFs (with Vercel Pro). pgvector semantic search + dedupe. Sheet templates, duplicate/version, export options.

---

## 10. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=          # public
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # public (RLS-protected)
SUPABASE_SERVICE_ROLE_KEY=         # SERVER ONLY — seeding/admin
GEMINI_API_KEY=                    # SERVER ONLY — default prototype AI provider
GROQ_API_KEY=                      # SERVER ONLY — optional, for the OCR+text path
# ANTHROPIC_API_KEY=               # SERVER ONLY — add later when swapping to Claude
```

Set all in the Vercel project (server scope for the secret ones). Never import the service role or Anthropic keys into client components.

---

## 11. Open decisions for the user (don't block; flag and proceed with the default)

1. **Question bank scope:** ship both a small **public/shared seed bank** and **per-user private questions** (assumed yes). Confirm whether the public bank is a launch priority or Phase 3.
2. **Audience:** assumed individual teachers first (vestibular/ENEM/escola). If it's school-wide/institutional (shared banks per school, multiple teachers), that adds an org/team model — flag before Phase 3.
3. **Auth providers:** email + magic link by default; add Google OAuth? (Recommended, low effort.)
4. **Answer keys / gabarito export:** include an optional separate answer-key PDF? (Recommended; cheap to add in Phase 1/2.)
5. **Launch hosting:** Vercel Pro at launch vs Cloudflare Pages to stay free (Section 8).

---

_End of handoff. Claude Code: start with Section 0, produce the plan, confirm, then build Phase 0 → 1._
