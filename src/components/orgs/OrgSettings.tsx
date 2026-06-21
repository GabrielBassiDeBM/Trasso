"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Trash2 } from "lucide-react";
import type { OrgRole } from "@/lib/types/database";
import { inviteMemberAction, updateMemberRoleAction, removeMemberAction } from "@/lib/actions/orgs";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { useT } from "@/lib/i18n/client";

interface OrgSettingsProps {
  org: { id: string; name: string; slug: string | null };
  members: { role: string; user_id: string; profile?: { display_name: string | null } | null }[];
  invitations: { id: string; email: string; role: string; expires_at: string | null }[];
  myRole: string;
}

const ROLE_KEYS = {
  dono: "orgs.role.owner",
  admin: "orgs.role.admin",
  membro: "orgs.role.member",
} as const;

export function OrgSettings({ org, members, invitations, myRole }: OrgSettingsProps) {
  const t = useT();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("membro");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const isAdmin = myRole === "dono" || myRole === "admin";

  function roleLabel(role: string) {
    return t(ROLE_KEYS[role as keyof typeof ROLE_KEYS] ?? "orgs.role.member");
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    const result = await inviteMemberAction(org.id, inviteEmail.trim(), inviteRole);
    setInviting(false);

    if (result.error) {
      setInviteError(result.error);
    } else {
      setInviteSuccess(true);
      setInviteEmail("");
    }
  }

  async function handleRemoveMember(userId: string) {
    const ok = await confirm({
      title: t("orgs.members.remove"),
      message: t("orgs.members.removeConfirm"),
      confirmLabel: t("common.remove"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    removeMemberAction(org.id, userId);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/82 px-8 py-4 backdrop-blur-[8px]">
        <Link href="/dashboard" className="text-xs font-medium text-ink-faint hover:text-ink">
          {t("editor.backToDashboard")}
        </Link>
        <h1 className="text-xl font-bold tracking-heading text-ink">
          {org.name}
        </h1>
        {org.slug && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-ink-soft">
            @{org.slug}
          </span>
        )}
      </header>

      <div className="flex-1 px-8 py-7 space-y-8 max-w-3xl">
        {/* Members */}
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-heading text-ink">
            {t("orgs.members.title", { n: members.length })}
          </h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {(m.profile?.display_name ?? m.user_id)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {m.profile?.display_name ?? t("orgs.members.fallbackName")}
                    </p>
                    <p className="text-xs text-ink-faint">{roleLabel(m.role)}</p>
                  </div>
                </div>
                {isAdmin && m.role !== "dono" && (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={m.role}
                      onChange={(e) => updateMemberRoleAction(org.id, m.user_id, e.target.value as OrgRole)}
                      className="h-8 rounded-lg border border-line bg-canvas px-2 text-xs text-ink"
                    >
                      <option value="admin">{t("orgs.role.admin")}</option>
                      <option value="membro">{t("orgs.role.member")}</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="rounded-lg p-1.5 text-ink-faint hover:text-danger"
                      aria-label={t("orgs.members.remove")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Invite */}
        {isAdmin && (
          <section>
            <h2 className="mb-4 text-lg font-bold tracking-heading text-ink">
              {t("orgs.invite.heading")}
            </h2>
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div>
                  <Label htmlFor="invite-email">{t("auth.signup.email")}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("orgs.invite.emailPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role">{t("orgs.invite.roleLabel")}</Label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                    className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="membro">{t("orgs.role.member")}</option>
                    <option value="admin">{t("orgs.role.admin")}</option>
                  </select>
                </div>
              </div>

              {inviteError && <p className="text-sm text-danger">{inviteError}</p>}
              {inviteSuccess && (
                <p className="text-sm text-success">{t("orgs.invite.success")}</p>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? t("orgs.invite.sending") : t("orgs.invite.submit")}
                {!inviting && <UserPlus size={14} />}
              </Button>
            </div>
          </section>
        )}

        {/* Pending invitations */}
        {isAdmin && invitations.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold tracking-heading text-ink">
              {t("orgs.pending.title", { n: invitations.length })}
            </h2>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{inv.email}</p>
                    <p className="text-xs text-ink-faint">
                      {roleLabel(inv.role)} · {t("orgs.pending.expires", { date: inv.expires_at ? new Date(inv.expires_at).toLocaleDateString("en-US") : "—" })}
                    </p>
                  </div>
                  <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
                    {t("orgs.pending.badge")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}
