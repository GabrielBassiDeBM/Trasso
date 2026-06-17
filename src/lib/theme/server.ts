import { cookies } from "next/headers";

export type Theme = "light" | "dark" | "system";

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get("trasso_theme")?.value;
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? "light" : theme;
}
