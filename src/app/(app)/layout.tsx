import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { getSubjects, getTopics } from "@/lib/data/sheets";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [{ data: { user } }, locale, subjects, allTopics] = await Promise.all([
    supabase.auth.getUser(),
    getLocale(),
    getSubjects(),
    getTopics(),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <AppShell
        userName={user?.user_metadata?.display_name ?? null}
        userEmail={user?.email ?? null}
        subjects={subjects}
        allTopics={allTopics}
      >
        {children}
      </AppShell>
    </LocaleProvider>
  );
}
