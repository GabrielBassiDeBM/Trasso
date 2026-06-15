/** All measurements are in millimeters, against an A4 page (210 x 297mm). */
export interface PageSettings {
  size: "A4";
  margins: { top: number; right: number; bottom: number; left: number };
  columns: 1 | 2;
  numbering: "numeric" | "none";
  answerLines: number;
  mcqStyle: "lettered" | "bubble";
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
  mcqStyle: "lettered",
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
      props: { text: "Avaliação", subtitle: "" },
    },
    {
      id: "field-nome",
      type: "student_field",
      x: 18,
      y: 40,
      w: 112,
      h: 10,
      props: { label: "Nome" },
    },
    {
      id: "field-data",
      type: "student_field",
      x: 134,
      y: 40,
      w: 58,
      h: 10,
      props: { label: "Data" },
    },
    {
      id: "field-turma",
      type: "student_field",
      x: 18,
      y: 54,
      w: 76,
      h: 10,
      props: { label: "Turma" },
    },
    {
      id: "field-nota",
      type: "score_box",
      x: 134,
      y: 54,
      w: 58,
      h: 10,
      props: { label: "Nota" },
    },
    {
      id: "instructions",
      type: "instructions",
      x: 18,
      y: 72,
      w: 174,
      h: 24,
      props: { text: "Leia atentamente cada questão antes de responder." },
    },
  ],
};
