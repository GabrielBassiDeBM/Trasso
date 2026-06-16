"use client";

import { useActionState, useState } from "react";
import { User, Lock, Palette } from "lucide-react";
import { updateProfileAction, updateEmailAction, updatePasswordAction, type ProfileActionState } from "@/lib/actions/profile";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const initial: ProfileActionState = { error: null };

type Tab = "profile" | "account" | "appearance";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
];

interface Props {
  initialDisplayName: string;
  initialInstitution: string;
  currentEmail: string;
}

export function SettingsClient({ initialDisplayName, initialInstitution, currentEmail }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initial);
  const [emailState, emailAction, emailPending] = useActionState(updateEmailAction, initial);
  const [pwState, pwAction, pwPending] = useActionState(updatePasswordAction, initial);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
        <h1 className="text-[20px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
          Settings
        </h1>
      </header>

      <div className="flex-1 px-8 py-7 max-w-2xl">
        {/* Tab bar */}
        <div className="mb-7 flex gap-1 rounded-xl border border-line bg-canvas p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                tab === id
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === "profile" && (
          <section className="rounded-2xl border border-line bg-surface p-6 space-y-5">
            <h2 className="text-base font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>Profile information</h2>
            <form action={profileAction} className="space-y-4">
              <div>
                <Label htmlFor="display_name">Display name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={initialDisplayName}
                  placeholder="e.g. Dr. Smith"
                />
              </div>
              <div>
                <Label htmlFor="institution">School / Institution</Label>
                <Input
                  id="institution"
                  name="institution"
                  defaultValue={initialInstitution}
                  placeholder="e.g. Westview High School"
                />
              </div>
              {profileState.error && (
                <p role="alert" className="text-sm text-danger">{profileState.error}</p>
              )}
              {profileState.success && (
                <p className="text-sm text-success">Profile updated successfully.</p>
              )}
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={profilePending}>
                  {profilePending ? "Saving…" : "Save profile"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Account */}
        {tab === "account" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-line bg-surface p-6 space-y-4">
              <h2 className="text-base font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>Change email</h2>
              <p className="text-sm text-ink-soft">Current email: <strong>{currentEmail}</strong></p>
              <form action={emailAction} className="space-y-4">
                <div>
                  <Label htmlFor="email">New email</Label>
                  <Input id="email" name="email" type="email" placeholder="new@example.com" />
                </div>
                {emailState.error && (
                  <p role="alert" className="text-sm text-danger">{emailState.error}</p>
                )}
                {emailState.success && (
                  <p className="text-sm text-success">Check your email to confirm the change.</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={emailPending}>
                    {emailPending ? "Sending…" : "Change email"}
                  </Button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-6 space-y-4">
              <h2 className="text-base font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>Change password</h2>
              <form action={pwAction} className="space-y-4">
                <div>
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" name="password" type="password" placeholder="At least 6 characters" />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirm password</Label>
                  <Input id="confirm_password" name="confirm_password" type="password" placeholder="Repeat the new password" />
                </div>
                {pwState.error && (
                  <p role="alert" className="text-sm text-danger">{pwState.error}</p>
                )}
                {pwState.success && (
                  <p className="text-sm text-success">Password changed successfully.</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={pwPending}>
                    {pwPending ? "Saving…" : "Change password"}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Appearance */}
        {tab === "appearance" && (
          <section className="rounded-2xl border border-line bg-surface p-6 space-y-5">
            <h2 className="text-base font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>Appearance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Theme</p>
                  <p className="text-xs text-ink-faint">Light / Dark</p>
                </div>
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Coming soon</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Language</p>
                  <p className="text-xs text-ink-faint">English</p>
                </div>
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Coming soon</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
