export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuestionType =
  | "open"
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "essay";

export type StatementFormat = "plain" | "latex" | "markdown";
export type Difficulty = "easy" | "medium" | "hard";
export type SheetStatus = "draft" | "ready";
export type AssetKind = "logo" | "screenshot" | "question_image" | "pdf";
export type AiUsageKind = "extract" | "generate" | "classify";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          institution: string | null;
          locale: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          institution?: string | null;
          locale?: string;
        };
        Update: {
          display_name?: string | null;
          institution?: string | null;
          locale?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: { id: string; name: string; parent_id: string | null };
        Insert: { id?: string; name: string; parent_id?: string | null };
        Update: { name?: string; parent_id?: string | null };
        Relationships: [];
      };
      topics: {
        Row: { id: string; subject_id: string; name: string; bncc_code: string | null };
        Insert: { id?: string; subject_id: string; name: string; bncc_code?: string | null };
        Update: { subject_id?: string; name?: string; bncc_code?: string | null };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          owner_id: string | null;
          statement: string;
          statement_format: StatementFormat;
          type: QuestionType;
          options: Json | null;
          answer: Json | null;
          subject_id: string | null;
          topic_id: string | null;
          difficulty: Difficulty | null;
          has_math: boolean;
          source: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          statement: string;
          statement_format?: StatementFormat;
          type: QuestionType;
          options?: Json | null;
          answer?: Json | null;
          subject_id?: string | null;
          topic_id?: string | null;
          difficulty?: Difficulty | null;
          has_math?: boolean;
          source?: string | null;
          tags?: string[];
        };
        Update: {
          statement?: string;
          statement_format?: StatementFormat;
          type?: QuestionType;
          options?: Json | null;
          answer?: Json | null;
          subject_id?: string | null;
          topic_id?: string | null;
          difficulty?: Difficulty | null;
          has_math?: boolean;
          source?: string | null;
          tags?: string[];
        };
        Relationships: [];
      };
      sheets: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          status: SheetStatus;
          page_settings: Json;
          cover_layout: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          status?: SheetStatus;
          page_settings?: Json;
          cover_layout?: Json;
        };
        Update: {
          title?: string;
          status?: SheetStatus;
          page_settings?: Json;
          cover_layout?: Json;
        };
        Relationships: [];
      };
      sheet_questions: {
        Row: {
          id: string;
          sheet_id: string;
          question_id: string | null;
          position: number;
          points: number | null;
          overrides: Json;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          question_id?: string | null;
          position: number;
          points?: number | null;
          overrides?: Json;
        };
        Update: {
          question_id?: string | null;
          position?: number;
          points?: number | null;
          overrides?: Json;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          owner_id: string;
          sheet_id: string | null;
          kind: AssetKind;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          sheet_id?: string | null;
          kind: AssetKind;
          storage_path: string;
        };
        Update: {
          sheet_id?: string | null;
          kind?: AssetKind;
          storage_path?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          owner_id: string;
          kind: AiUsageKind;
          tokens_in: number | null;
          tokens_out: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          kind: AiUsageKind;
          tokens_in?: number | null;
          tokens_out?: number | null;
        };
        Update: {
          tokens_in?: number | null;
          tokens_out?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
