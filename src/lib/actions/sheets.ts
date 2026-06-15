"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SETTINGS, DEFAULT_COVER_LAYOUT, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import type { Json } from "@/lib/types/database";

export interface SheetActionState {
  error: string | null;
}

export async function createSheetAction(_prev: SheetActionState, formData: FormData): Promise<SheetActionState> {
  const title = String(formData.get("title") ?? "").trim() || "Lista sem título";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("sheets")
    .insert({
      owner_id: userData.user.id,
      title,
      page_settings: DEFAULT_PAGE_SETTINGS as unknown as Json,
      cover_layout: DEFAULT_COVER_LAYOUT as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Não foi possível criar a lista." };
  }

  revalidatePath("/dashboard");
  redirect(`/sheets/${data.id}`);
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

export async function uploadLogoAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo de imagem." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "O logo precisa ser uma imagem (PNG, JPG ou SVG)." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "A imagem precisa ter no máximo 2 MB." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return { url: data.publicUrl };
}
