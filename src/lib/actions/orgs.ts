"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrgRole } from "@/lib/types/database";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function createOrgAction(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Organization name is required." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const slug = slugify(name);

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug, created_by: userData.user.id })
    .select("id")
    .single();

  if (orgError || !org) return { error: orgError?.message ?? "Could not create organization." };

  // Creator becomes dono
  await supabase.from("organization_members").insert({
    org_id: org.id,
    user_id: userData.user.id,
    role: "dono",
  });

  revalidatePath("/dashboard");
  redirect(`/orgs/${org.id}`);
}

export async function inviteMemberAction(
  orgId: string,
  email: string,
  role: OrgRole = "membro",
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired." };

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("invitations").insert({
    org_id: orgId,
    email,
    role,
    token,
    invited_by: userData.user.id,
    expires_at: expires.toISOString(),
  });

  if (error) return { error: error.message };

  // Send invite email via Supabase auth invite
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { org_invite_token: token, org_id: orgId },
  });

  if (inviteError) {
    // Don't fail — token exists, user can still receive it manually
    console.error("Supabase invite email failed:", inviteError.message);
  }

  revalidatePath(`/orgs/${orgId}`);
  return { error: null };
}

export async function acceptInviteAction(token: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Please sign in to accept the invitation." };

  const { data: inv, error: invError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pendente")
    .single();

  if (invError || !inv) return { error: "Invalid or expired invitation." };

  if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
    await supabase.from("invitations").update({ status: "expirado" }).eq("id", inv.id);
    return { error: "This invitation has expired." };
  }

  // Add member
  const { error: memberError } = await supabase.from("organization_members").insert({
    org_id: inv.org_id,
    user_id: userData.user.id,
    role: inv.role,
  });

  if (memberError) return { error: memberError.message };

  await supabase.from("invitations").update({ status: "aceito" }).eq("id", inv.id);

  revalidatePath("/dashboard");
  redirect(`/orgs/${inv.org_id}`);
}

export async function updateMemberRoleAction(
  orgId: string,
  userId: string,
  role: OrgRole,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("organization_members").update({ role }).match({ org_id: orgId, user_id: userId });
  revalidatePath(`/orgs/${orgId}`);
}

export async function removeMemberAction(orgId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("organization_members").delete().match({ org_id: orgId, user_id: userId });
  revalidatePath(`/orgs/${orgId}`);
}

export async function createFolderAction(
  sheetId: string | null,
  name: string,
  orgId: string | null,
): Promise<{ error: string | null; folderId: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session expired.", folderId: null };

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name,
      org_id: orgId,
      owner_id: orgId ? null : userData.user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Erro ao criar pasta.", folderId: null };
  revalidatePath("/dashboard");
  return { error: null, folderId: data.id };
}

export async function moveSheetToFolderAction(sheetId: string, folderId: string | null): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sheets").update({ folder_id: folderId }).eq("id", sheetId);
  revalidatePath("/dashboard");
}
