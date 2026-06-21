"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export interface AuthActionState {
  error: string | null;
  success?: string;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function safeRedirectTarget(formData: FormData): string {
  const target = String(formData.get("redirectTo") ?? "");
  return target.startsWith("/") ? target : "/dashboard";
}

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const locale = await getLocale();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !password) {
    return { error: translate(locale, "auth.error.emailPasswordRequired") };
  }
  if (password.length < 6) {
    return { error: translate(locale, "auth.error.passwordTooShort") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      error: null,
      success: translate(locale, "auth.success.signupConfirm"),
    };
  }

  redirect("/dashboard");
}

export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const locale = await getLocale();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: translate(locale, "auth.error.emailPasswordRequired") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: translate(locale, "auth.error.confirmEmail") };
    }
    return { error: translate(locale, "auth.error.invalidCredentials") };
  }

  redirect(safeRedirectTarget(formData));
}

export async function sendMagicLinkAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const locale = await getLocale();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: translate(locale, "auth.error.emailRequired") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, success: translate(locale, "auth.success.magicLinkSent") };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
