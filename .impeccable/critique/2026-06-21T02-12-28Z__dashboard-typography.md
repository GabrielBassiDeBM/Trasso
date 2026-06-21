---
target: dashboard typography (app UI, not PDF)
total_score: 0
p0_count: 0
p1_count: 1
timestamp: 2026-06-21T02-12-28Z
slug: dashboard-typography
---
## Anti-Pattern Verdict: Typography
LLM assessment: Plus Jakarta Sans as single UI family is a deliberate, reasonable pick (not AI-slop). Print serif correctly quarantined to PDF output. The issue is scale discipline, not font choice.
Evidence: 79 arbitrary `text-[Npx]` declarations across 14 component files, alongside Tailwind's named scale used for the same hierarchy levels.

## What's Working
- Single UI family (Jakarta Sans) per product-register convention.
- Print serif correctly quarantined to `.a11y-print`/PDF contexts.
- Negative letter-spacing (-0.01em) on headings is a sensible touch.

## Priority Issues
[P1] No real type scale — arbitrary pixel values instead of steps. Evidence: SheetCard.tsx:218 (text-[15px]), :208/229/241/252 (text-[11px]), :276 (text-[12px]), DashboardTopbar.tsx:29 (text-[20px]), NewSheetModal.tsx:141 (text-[10px]). Fix: define ~6 named rem-based steps at 1.125-1.15 ratio, sweep the 79 instances onto nearest step. Suggested command: /impeccable typeset

[P2] Heading letter-spacing is inline and repeated, not a token. Evidence: DashboardTopbar.tsx:29, EditSheetModal.tsx:116, NewSheetModal.tsx:113, SheetCard.tsx:218 all hand-write style={{letterSpacing:"-0.01em"}}. Fix: add tracking-heading token/utility. Suggested command: /impeccable typeset

[P3] --font-display is a dead alias pointing to the same font as --font-sans (globals.css:201-202), used only by Navbar.tsx:20. Fix: drop the token or comment the intent. Suggested command: /impeccable typeset

## Minor Observations
Weight usage (medium/semibold/bold) is mostly consistent; re-audit once sizes are consolidated.
