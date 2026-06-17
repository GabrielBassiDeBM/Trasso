import { cookies } from "next/headers";
import type { Locale } from "./translations";

export type { Locale };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("trasso_locale")?.value;
  if (value === "en" || value === "pt") return value;
  return "en";
}
