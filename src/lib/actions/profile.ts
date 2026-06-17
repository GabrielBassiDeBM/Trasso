"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/server";
import type { Theme } from "@/lib/theme/server";

export interface ProfileActionState {
  error: string | null;
  success?: boolean;
}

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null, institution: institution || null })
    .eq("id", userData.user.id);

  if (error) return { error: error.message };

  if (displayName) {
    await supabase.auth.updateUser({ data: { display_name: displayName } });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function updateEmailAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  return { error: null, success: true };
}

export async function updateLocaleAction(locale: Locale): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  await supabase.from("profiles").update({ locale }).eq("id", userData.user.id);

  const cookieStore = await cookies();
  cookieStore.set("trasso_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  revalidatePath("/", "layout");
}

export async function updateThemeAction(theme: Theme): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  await supabase.from("profiles").update({ theme }).eq("id", userData.user.id);

  const cookieStore = await cookies();
  cookieStore.set("trasso_theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  revalidatePath("/", "layout");
}

export async function updatePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { error: null, success: true };
}
