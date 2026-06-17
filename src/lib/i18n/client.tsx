"use client";

import { createContext, useContext, type ReactNode } from "react";
import { translate, type Locale, type TranslationKey } from "./translations";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useLocale();
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
