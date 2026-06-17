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
export type ExamType = "prova" | "lista" | "simulado" | "recuperacao";
export type OrgRole = "dono" | "admin" | "membro";
export type InvitationStatus = "pendente" | "aceito" | "expirado";
export type AdaptationType = "dislexia" | "baixa_visao" | "linguagem_simples" | "ampliada";

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
          org_id: string | null;
          parent_question_id: string | null;
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
          bncc_code: string | null;
          is_adapted: boolean;
          is_public: boolean;
          adaptation_type: AdaptationType | null;
          adapted_from: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          org_id?: string | null;
          parent_question_id?: string | null;
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
          bncc_code?: string | null;
          is_adapted?: boolean;
          is_public?: boolean;
          adaptation_type?: AdaptationType | null;
          adapted_from?: string | null;
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
          bncc_code?: string | null;
          is_adapted?: boolean;
          is_public?: boolean;
          adaptation_type?: AdaptationType | null;
          adapted_from?: string | null;
        };
        Relationships: [];
      };
      sheets: {
        Row: {
          id: string;
          owner_id: string;
          org_id: string | null;
          folder_id: string | null;
          title: string;
          status: SheetStatus;
          subject_id: string | null;
          subject_ids: string[];
          topic_ids: string[];
          difficulty: Difficulty | null;
          grade_level: string | null;
          turma: string | null;
          exam_type: ExamType | null;
          categories: string[];
          page_settings: Json;
          cover_layout: Json;
          accessibility: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          org_id?: string | null;
          folder_id?: string | null;
          title: string;
          status?: SheetStatus;
          subject_id?: string | null;
          subject_ids?: string[];
          topic_ids?: string[];
          difficulty?: Difficulty | null;
          grade_level?: string | null;
          turma?: string | null;
          exam_type?: ExamType | null;
          categories?: string[];
          page_settings?: Json;
          cover_layout?: Json;
          accessibility?: Json;
        };
        Update: {
          title?: string;
          status?: SheetStatus;
          org_id?: string | null;
          folder_id?: string | null;
          subject_id?: string | null;
          subject_ids?: string[];
          topic_ids?: string[];
          difficulty?: Difficulty | null;
          grade_level?: string | null;
          turma?: string | null;
          exam_type?: ExamType | null;
          categories?: string[];
          page_settings?: Json;
          cover_layout?: Json;
          accessibility?: Json;
        };
        Relationships: [];
      };
      question_groups: {
        Row: {
          id: string;
          sheet_id: string;
          instructions: string | null;
          passage: string | null;
          passage_format: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          instructions?: string | null;
          passage?: string | null;
          passage_format?: string;
          position: number;
        };
        Update: {
          instructions?: string | null;
          passage?: string | null;
          passage_format?: string;
          position?: number;
        };
        Relationships: [];
      };
      sheet_questions: {
        Row: {
          id: string;
          sheet_id: string;
          question_id: string | null;
          group_id: string | null;
          position: number;
          points: number | null;
          overrides: Json;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          question_id?: string | null;
          group_id?: string | null;
          position: number;
          points?: number | null;
          overrides?: Json;
        };
        Update: {
          question_id?: string | null;
          group_id?: string | null;
          position?: number;
          points?: number | null;
          overrides?: Json;
        };
        Relationships: [];
      };
      sheet_variants: {
        Row: {
          id: string;
          sheet_id: string;
          label: string;
          seed: number;
          answer_key: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          label: string;
          seed: number;
          answer_key?: Json;
        };
        Update: {
          label?: string;
          seed?: number;
          answer_key?: Json;
        };
        Relationships: [];
      };
      class_rosters: {
        Row: {
          id: string;
          owner_id: string;
          turma: string;
          students: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          turma: string;
          students?: Json;
        };
        Update: {
          turma?: string;
          students?: Json;
        };
        Relationships: [];
      };
      exam_results: {
        Row: {
          id: string;
          sheet_id: string;
          variant_id: string | null;
          student_name: string | null;
          registry_no: string | null;
          answers: Json | null;
          score: number | null;
          per_question: Json | null;
          graded_at: string;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          variant_id?: string | null;
          student_name?: string | null;
          registry_no?: string | null;
          answers?: Json | null;
          score?: number | null;
          per_question?: Json | null;
        };
        Update: {
          answers?: Json | null;
          score?: number | null;
          per_question?: Json | null;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          default_cover_layout: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          default_cover_layout?: Json | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          slug?: string | null;
          default_cover_layout?: Json | null;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          org_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role?: OrgRole;
        };
        Update: {
          role?: OrgRole;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: OrgRole;
          token: string;
          status: InvitationStatus;
          invited_by: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: OrgRole;
          token: string;
          status?: InvitationStatus;
          invited_by?: string | null;
          expires_at?: string | null;
        };
        Update: {
          status?: InvitationStatus;
          role?: OrgRole;
        };
        Relationships: [];
      };
      folders: {
        Row: {
          id: string;
          org_id: string | null;
          owner_id: string | null;
          parent_id: string | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          owner_id?: string | null;
          parent_id?: string | null;
          name: string;
        };
        Update: {
          org_id?: string | null;
          owner_id?: string | null;
          parent_id?: string | null;
          name?: string;
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
