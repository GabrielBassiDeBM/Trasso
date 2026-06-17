"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccessibilityNeed =
  | "dyslexia"
  | "adhd"
  | "visual_impairment"
  | "hearing_impairment"
  | "motor"
  | "other";

export interface Student {
  name: string;
  registry_no: string;
  accessibility_needs?: AccessibilityNeed[];
}

export interface ClassRoster {
  id: string;
  owner_id: string;
  turma: string;
  students: Student[];
  created_at: string;
}

export async function getClassRosters(): Promise<ClassRoster[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("class_rosters")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    students: Array.isArray(row.students) ? (row.students as unknown as Student[]) : [],
  }));
}

export interface ClassActionState {
  error: string | null;
  success?: boolean;
  roster?: ClassRoster;
}

export async function createClassAction(
  _prev: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Class name is required." };

  const { data, error } = await supabase
    .from("class_rosters")
    .insert({ owner_id: user.id, turma: name, students: [] })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/classes");
  return {
    error: null,
    success: true,
    roster: { ...data, students: [] } as ClassRoster,
  };
}

export async function deleteClassAction(
  _prev: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const id = formData.get("id") as string | null;
  if (!id) return { error: "Missing class ID." };

  const { error } = await supabase
    .from("class_rosters")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/classes");
  return { error: null, success: true };
}

export async function bulkDeleteClassesAction(
  ids: string[],
): Promise<ClassActionState> {
  if (!ids.length) return { error: null };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("class_rosters")
    .delete()
    .in("id", ids)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/classes");
  return { error: null, success: true };
}

export async function updateClassStudentsAction(
  _prev: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const id = formData.get("id") as string | null;
  const studentsJson = formData.get("students") as string | null;
  if (!id || !studentsJson) return { error: "Missing data." };

  let students: Student[];
  try {
    students = JSON.parse(studentsJson);
  } catch {
    return { error: "Invalid student data." };
  }

  const { error } = await supabase
    .from("class_rosters")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ students: students as any })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/classes");
  return { error: null, success: true };
}
