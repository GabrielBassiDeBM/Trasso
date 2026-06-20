export type PaperSize = "A4" | "A3" | "A5";

export interface PaperSizeSpec {
  label: string;
  widthMm: number;
  heightMm: number;
}

/** Width/height in millimeters. CSS `@page { size: ... }` recognizes these names directly. */
export const PAPER_SIZES: Record<PaperSize, PaperSizeSpec> = {
  A4: { label: "A4 (210 × 297 mm)", widthMm: 210, heightMm: 297 },
  A3: { label: "A3 (297 × 420 mm)", widthMm: 297, heightMm: 420 },
  A5: { label: "A5 (148 × 210 mm)", widthMm: 148, heightMm: 210 },
};

/** All measurements are in millimeters, against the selected paper size. */
export interface PageSettings {
  size: PaperSize;
  margins: { top: number; right: number; bottom: number; left: number };
  columns: 1 | 2;
  numbering: "numeric" | "none";
  answerLines: number;
  showAnswerLines: boolean;
  mcqStyle: "lettered" | "bubble";
  pointsPerQuestion: boolean;
}

export type CoverBlockType =
  | "title"
  | "student_field"
  | "score_box"
  | "instructions"
  | "logo";

export interface CoverBlock {
  id: string;
  type: CoverBlockType;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, string>;
}

export interface CoverLayout {
  blocks: CoverBlock[];
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  size: "A4",
  margins: { top: 20, right: 18, bottom: 20, left: 18 },
  columns: 1,
  numbering: "numeric",
  answerLines: 3,
  showAnswerLines: true,
  mcqStyle: "lettered",
  pointsPerQuestion: false,
};

export const DEFAULT_COVER_LAYOUT: CoverLayout = {
  blocks: [
    {
      id: "title",
      type: "title",
      x: 18,
      y: 14,
      w: 174,
      h: 20,
      props: { text: "Exam", subtitle: "" },
    },
    {
      id: "field-name",
      type: "student_field",
      x: 18,
      y: 40,
      w: 112,
      h: 10,
      props: { label: "Name" },
    },
    {
      id: "field-date",
      type: "student_field",
      x: 134,
      y: 40,
      w: 58,
      h: 10,
      props: { label: "Date" },
    },
    {
      id: "field-period",
      type: "student_field",
      x: 18,
      y: 54,
      w: 76,
      h: 10,
      props: { label: "Period" },
    },
    {
      id: "field-score",
      type: "score_box",
      x: 134,
      y: 54,
      w: 58,
      h: 10,
      props: { label: "Score" },
    },
    {
      id: "instructions",
      type: "instructions",
      x: 18,
      y: 72,
      w: 174,
      h: 24,
      props: { text: "Read each question carefully before answering." },
    },
  ],
};
