"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { takeToken, getClientIp } from "@/lib/rateLimiter";

export interface AuthActionState {
  error: string | null;
  success?: string;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
const SIGNUP_MAX_ATTEMPTS = 5;

/** Best-effort brute-force throttle keyed by IP+email — see rateLimiter.ts TODO re: multi-instance deploys. */
async function checkAuthRateLimit(bucket: string, email: string, limit: number, windowMs: number) {
  const ip = getClientIp(await headers());
  return takeToken(`${bucket}:${ip}:${email.toLowerCase()}`, limit, windowMs);
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

  const limit = await checkAuthRateLimit("signup", email, SIGNUP_MAX_ATTEMPTS, SIGNUP_WINDOW_MS);
  if (!limit.ok) {
    return { error: translate(locale, "auth.error.tooManyAttempts") };
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

  const limit = await checkAuthRateLimit("signin", email, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limit.ok) {
    return { error: translate(locale, "auth.error.tooManyAttempts") };
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

  const limit = await checkAuthRateLimit("magic-link", email, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limit.ok) {
    return { error: translate(locale, "auth.error.tooManyAttempts") };
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
