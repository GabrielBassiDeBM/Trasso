import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AppShell
      userName={user?.user_metadata?.display_name ?? null}
      userEmail={user?.email ?? null}
    >
      {children}
    </AppShell>
  );
}
