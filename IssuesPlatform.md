# trasso — Things that need to change

### Sheet Creation
- **Blank** — There shouldnt be the grade level and period class options. There needs to be a way to add subjects categorization to the sheets being created.

**Sheet metadata:** title, exam type (Test / Problem Set / Practice Test / Review), subject, grade level, class/period, categories/tags

Also, if there is a reason for the type of sheet (review, exam, etc), at least make it different in the dashboard (different icons, color, category)

### Question Bank
- ~~**Personal bank** — You cannot delete questions~~ ✅ Delete button added; removes question from all sheets.
- ~~**Personal bank** — the UI is way too bland~~ ✅ Redesigned: subject color bars, icon chips, difficulty bar indicators, grouped by subject.
- ~~**Personal bank** — the questions aren't categorized~~ ✅ Questions now grouped by subject with icon + count header.
- **Personal bank** — There should also be a button to add questions to the personal bank. *(button rendered; standalone creation modal pending)*
- ~~**Personal bank** — filters weren't on a bar by default~~ ✅ Filters hidden by default; toggle button in topbar expands the filter bar.
- ~~**Personal bank** — should only be able to choose topic from the subject you're filtering~~ ✅ Topic dropdown only appears when a subject is selected.
- ~~**Personal bank** — The filters should allow choosing many things at once.~~ ✅ Full multi-select: type chips and difficulty bars each toggle independently; topics cascade instantly client-side from the selected subject; filter changes debounced for fluid UX.
- ~~**Personal bank** — difficulty filter should be 3 rectangles in varying colors~~ ✅ Difficulty is 3 stacked bars (green / brand / red) in both the filter bar and each card.
- ~~**Personal bank** — add subject icons to each question box~~ ✅ BarChart2 (Math), Zap (Physics), FlaskConical (Chemistry), Leaf (Biology), Code2 (CS), TreePine (Environmental), BookOpen (Reading/Writing).

### AI Features (via `lib/ai/provider.ts` → Google Gemini Flash)
Ai doesnt work.

### Layout & Output
- **Cover designer** — For each sheet, there should also be smart grids for the cover, so objects snap relative to each other, way to alter colors of everything, colored margins.

The points per question should be optional. Adding a passage reading block doesnt work.

- **Scannable answer card** — Not creating this.

- **Variants** — "value "1781631350146" is out of range for type integer" shows up when trying to use that

- **Combined PDF** — apparently doesnt create this still.

### Grading
Did not test this yet

### Classes
- Class rosters with student lists (name + registry number)
- Associate a class/period with sheets
- Assign combined prints to a roster (one per student)
Make it like this

### Organizations
The organization dashboard should - Create org, invite members by email
- Roles: Owner, Admin, Member
- Shared folders; sheets visible to all members
- Org default cover template (applied to new org sheets)
It doesnt do this. Create the page for organization.

### Accessibility
When going to print an addapted sheet, the whole font of the website changes to the dyslexic one, not only that in the sheet.

---

## Data Model (Supabase / Postgres)

Add an admin way to enter the platform so that I can add questions to the global bank

---

## SAT/AP STEM Subjects

~~SAT Reading & Writing missing~~ ✅ Added via migration `0009_sat_reading_writing.sql` with 4 topics.

~~Topics, subjects, and filters appear in English in Portuguese mode~~ ✅ Portuguese translations added for all topic names, bank filter labels, question type labels, and difficulty labels. SAT/AP subject names stay in English (internationally recognized proper nouns).

| Category | Courses |
|---|---|
| Math | SAT Math, AP Precalculus, AP Calculus AB, AP Calculus BC, AP Statistics |
| Physics | AP Physics 1, AP Physics 2, AP Physics C: Mechanics, AP Physics C: E&M |
| Chemistry | AP Chemistry |
| Biology | AP Biology |
| Computer Science | AP Computer Science A, AP Computer Science Principles |
| Environmental Science | AP Environmental Science |
| Reading & Writing | SAT Reading & Writing ✅ |
