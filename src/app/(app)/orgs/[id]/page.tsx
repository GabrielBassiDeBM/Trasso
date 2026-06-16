import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrgSettings } from "@/components/orgs/OrgSettings";
import type { OrgRole } from "@/lib/types/database";

type MemberRow = { user_id: string; role: OrgRole; profile: { display_name: string | null } | null };

export const metadata: Metadata = { title: "Organization — trasso" };

export default async function OrgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: org }, { data: members }, { data: invitations }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", id).single(),
    supabase
      .from("organization_members")
      .select("role, user_id, profile:profiles(display_name)")
      .eq("org_id", id) as unknown as Promise<{ data: MemberRow[] | null }>,
    supabase
      .from("invitations")
      .select("*")
      .eq("org_id", id)
      .eq("status", "pendente"),
  ]);

  if (!org) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const myRole = members?.find((m) => m.user_id === userData.user?.id)?.role ?? "membro";

  return (
    <OrgSettings
      org={org}
      members={members ?? []}
      invitations={invitations ?? []}
      myRole={myRole}
    />
  );
}
