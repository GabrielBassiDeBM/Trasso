# trasso — Platform Reference

## What it is
trasso is a test and worksheet builder for SAT/AP STEM educators. Teachers create printable A4 PDFs with question banks, AI assistance, answer keys, variant shuffling, and OMR auto-grading — all in the browser.

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in (password or magic link) |
| `/signup` | Create account |
| `/dashboard` | Sheet list with stats and filters |
| `/sheets/[id]` | Sheet editor |
| `/sheets/[id]/print` | Print view (full A4 document) |
| `/sheets/[id]/print/gabarito` | Answer key print view |
| `/sheets/[id]/print/variants` | All variants print view |
| `/banco` | Question bank (public + personal tabs) |
| `/gabarito` | OMR auto-grading dashboard |
| `/classes` | Class roster management |
| `/orgs` | Organizations list |
| `/orgs/new` | Create organization |
| `/orgs/[id]` | Organization settings |
| `/invite` | Accept org invitation |
| `/settings` | User profile, account, appearance |
| `/auth/callback` | Supabase auth callback |

---

## Features

### Sheet Creation
- **Blank** — start from zero
- **AI Generate** — describe a topic; AI produces structured questions
- **Scan from photo** — photograph a printed question; AI extracts it into the editor

**Sheet metadata:** title, exam type (Test / Problem Set / Practice Test / Review), subject, grade level, class/period, categories/tags

### Question Types
| Type | Key |
|---|---|
| Multiple Choice | `multiple_choice` |
| Open / Short Answer | `open` |
| True / False | `true_false` |
| Fill in the Blank | `fill_blank` |
| Matching | `matching` |
| Essay | `essay` |

All types support inline LaTeX (MathLive input → KaTeX render).

### Question Bank
- **Personal bank** — questions from your own sheets, searchable and reusable
- **Public bank** — curated seed questions (coming soon)
- Filters: subject, topic, question type, difficulty, adapted flag
- Full-text search

### AI Features (via `lib/ai/provider.ts` → Google Gemini Flash)
| Endpoint | Action |
|---|---|
| `POST /api/ai/scan-question` | Extract question from image |
| `POST /api/ai/generate-questions` | Generate questions from topic params |
| `POST /api/ai/generate-sheet` | Generate a full sheet with structure |
| `POST /api/ai/classify` | Auto-classify subject/topic |
| `POST /api/ai/coauthor` | Transform a question (harder, easier, distractor, simplify, check, solution, variations) |

All AI calls are auth-gated, rate-limited via `ai_usage`, and go through an editable review panel before saving.

### Layout & Output
- **Cover designer** — drag-and-resize blocks: title, student fields, score box, instructions, logo
- **Page settings** — margins, 1–2 columns, question numbering style, answer-line count, MCQ bubble/lettered style
- **Print view** — browser print path → clean A4 PDF
- **Answer key** — auto-generated gabarito view
- **Scannable answer card** — bubble grid with registration marks and version ID for OMR
- **Variants** — N shuffled versions (question order + option order), each with its own key and answer card
- **Combined PDF** — all variants or one per student, printed in one pass

### Grading
- **OMR auto-grading** — upload photo of filled answer card; OpenCV.js detects bubbles in browser; scores against variant key
- Results per student and per question
- CSV export
- Item analysis: difficulty index, discrimination index, distractor analysis

### Classes
- Class rosters with student lists (name + registry number)
- Associate a class/period with sheets
- Assign combined prints to a roster (one per student)

### Organizations
- Create org, invite members by email
- Roles: Owner, Admin, Member
- Shared folders; sheets visible to all members
- Org default cover template (applied to new org sheets)

### Accessibility
- **Adapted sheet variant** — same questions, re-typeset with OpenDyslexic font, enlarged type, relaxed spacing, single column, higher contrast, extra answer space
- Questions tagged `is_adapted` + `adaptation_type` + `adapted_from` (linked to original)
- AI "simplify language" action produces linked adapted questions
- App UI: WCAG 2.1 AA, visible focus rings, `prefers-reduced-motion` support

---

## Data Model (Supabase / Postgres)

| Table | Purpose |
|---|---|
| `profiles` | User display name, institution, locale |
| `subjects` | Subject taxonomy (hierarchical) |
| `topics` | Topics per subject, with BNCC/AP code |
| `questions` | Question bank; owner + org scoped; `is_adapted` flag |
| `sheets` | Exam/worksheet metadata; owner + org + folder scoped |
| `question_groups` | Passage/context blocks linking multiple questions |
| `sheet_questions` | Questions on a sheet (ordered, with points + overrides) |
| `sheet_variants` | Shuffled variants with answer key per variant |
| `class_rosters` | Student lists per class/period |
| `exam_results` | OMR-graded results per student per variant |
| `organizations` | Teams with slug and default cover layout |
| `organization_members` | Org membership with role |
| `invitations` | Email invitations with token + status |
| `folders` | Personal or org-scoped folder tree |
| `assets` | Uploaded images/logos (logo, question images, PDFs) |
| `ai_usage` | Per-user AI call log for rate limiting |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth + DB | Supabase (Postgres + Storage) |
| Styling | Tailwind CSS v4 |
| Math input | MathLive |
| Math render | KaTeX |
| AI | Google Gemini Flash (via `lib/ai/provider.ts`) |
| OMR grading | OpenCV.js (browser-side) |
| Fonts | Plus Jakarta Sans (display/body), Spline Sans Mono (mono) |

---

## SAT/AP STEM Subjects

| Category | Courses |
|---|---|
| Math | SAT Math, AP Precalculus, AP Calculus AB, AP Calculus BC, AP Statistics |
| Physics | AP Physics 1, AP Physics 2, AP Physics C: Mechanics, AP Physics C: E&M |
| Chemistry | AP Chemistry |
| Biology | AP Biology |
| Computer Science | AP Computer Science A, AP Computer Science Principles |
| Environmental Science | AP Environmental Science |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # server-only
GEMINI_API_KEY                 # server-only
```
