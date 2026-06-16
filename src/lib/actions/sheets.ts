"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SETTINGS, DEFAULT_COVER_LAYOUT, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import type { Json } from "@/lib/types/database";
import type { ExamType } from "@/lib/types/database";

export interface SheetActionState {
  error: string | null;
}

export async function createSheetAction(_prev: SheetActionState, formData: FormData): Promise<SheetActionState> {
  const title = String(formData.get("title") ?? "").trim() || "Untitled sheet";
  const examType = String(formData.get("exam_type") ?? "").trim() || null;
  const gradeLevel = String(formData.get("grade_level") ?? "").trim() || null;
  const turma = String(formData.get("turma") ?? "").trim() || null;
  const mode = String(formData.get("mode") ?? "blank");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired. Please sign in again." };

  const { data, error } = await supabase
    .from("sheets")
    .insert({
      owner_id: userData.user.id,
      title,
      exam_type: (examType as ExamType | null) ?? null,
      grade_level: gradeLevel,
      turma,
      page_settings: DEFAULT_PAGE_SETTINGS as unknown as Json,
      cover_layout: DEFAULT_COVER_LAYOUT as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create sheet." };
  }

  revalidatePath("/dashboard");

  if (mode === "ai_generate") {
    redirect(`/sheets/${data.id}?ai=generate`);
  } else if (mode === "scan") {
    redirect(`/sheets/${data.id}?ai=scan`);
  } else {
    redirect(`/sheets/${data.id}`);
  }
}

export async function renameSheetAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;

  const supabase = await createClient();
  await supabase.from("sheets").update({ title }).eq("id", id);

  revalidatePath("/dashboard");
  revalidatePath(`/sheets/${id}`);
}

export async function deleteSheetAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("sheets").delete().eq("id", id);

  revalidatePath("/dashboard");
}

export async function updatePageSettingsAction(sheetId: string, settings: PageSettings): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("sheets")
    .update({ page_settings: settings as unknown as Json })
    .eq("id", sheetId);

  revalidatePath(`/sheets/${sheetId}`);
}

export async function updateCoverLayoutAction(sheetId: string, layout: CoverLayout): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("sheets")
    .update({ cover_layout: layout as unknown as Json })
    .eq("id", sheetId);

  revalidatePath(`/sheets/${sheetId}`);
}

export async function updateSheetMetaAction(
  sheetId: string,
  meta: { grade_level?: string | null; turma?: string | null; exam_type?: ExamType | null; categories?: string[] }
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheets").update(meta).eq("id", sheetId);
  revalidatePath(`/sheets/${sheetId}`);
}

export async function updateAccessibilityAction(
  sheetId: string,
  accessibility: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("sheets")
    .update({ accessibility: accessibility as unknown as Json })
    .eq("id", sheetId);
  revalidatePath(`/sheets/${sheetId}`);
}

export async function uploadLogoAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Please select an image file." };
  if (!file.type.startsWith("image/")) return { error: "Logo must be an image (PNG, JPG, or SVG)." };
  if (file.size > 2 * 1024 * 1024) return { error: "Image must be 2 MB or less." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired. Please sign in again." };

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function uploadQuestionImageAction(
  formData: FormData
): Promise<{ url: string; path: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Please select an image." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are accepted." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be 5 MB or less." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const extension = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("question-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("question-images").getPublicUrl(storagePath);
  return { url: data.publicUrl, path: storagePath };
}
