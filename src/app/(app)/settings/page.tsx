import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings — trasso" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, institution, locale")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <SettingsClient
      initialDisplayName={profile?.display_name ?? user?.user_metadata?.display_name ?? ""}
      initialInstitution={profile?.institution ?? ""}
      currentEmail={user?.email ?? ""}
    />
  );
}
