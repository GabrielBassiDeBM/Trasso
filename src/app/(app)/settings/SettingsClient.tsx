"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import { User, Lock, Palette, Check, Sun, Moon, Monitor } from "lucide-react";
import { updateProfileAction, updateEmailAction, updatePasswordAction, updateLocaleAction, type ProfileActionState } from "@/lib/actions/profile";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useT, useLocale } from "@/lib/i18n/client";
import { useTheme } from "@/lib/theme/client";
import type { Locale } from "@/lib/i18n/translations";
import type { Theme } from "@/lib/theme/server";

const initial: ProfileActionState = { error: null };

type Tab = "profile" | "account" | "appearance";

interface Props {
  initialDisplayName: string;
  initialInstitution: string;
  currentEmail: string;
  initialLocale: Locale;
}

export function SettingsClient({ initialDisplayName, initialInstitution, currentEmail, initialLocale }: Props) {
  const t = useT();
  const contextLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("profile");
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initial);
  const [emailState, emailAction, emailPending] = useActionState(updateEmailAction, initial);
  const [pwState, pwAction, pwPending] = useActionState(updatePasswordAction, initial);
  const [isPending, startTransition] = useTransition();

  const [optimisticLocale, setOptimisticLocale] = useOptimistic(
    initialLocale ?? contextLocale,
    (_: Locale, next: Locale) => next,
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: t("settings.tabs.profile"), icon: User },
    { id: "account", label: t("settings.tabs.account"), icon: Lock },
    { id: "appearance", label: t("settings.tabs.appearance"), icon: Palette },
  ];

  function handleLocaleChange(next: Locale) {
    startTransition(async () => {
      setOptimisticLocale(next);
      await updateLocaleAction(next);
    });
  }

  const THEMES: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "light", label: t("settings.appearance.themeLight"), icon: Sun },
    { value: "dark", label: t("settings.appearance.themeDark"), icon: Moon },
    { value: "system", label: t("settings.appearance.themeSystem"), icon: Monitor },
  ];

  const LANGUAGES: { value: Locale; label: string; flag: string }[] = [
    { value: "en", label: t("settings.appearance.english"), flag: "🇺🇸" },
    { value: "pt", label: t("settings.appearance.portuguese"), flag: "🇧🇷" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
        <h1 className="text-xl font-bold tracking-heading text-ink">
          {t("settings.title")}
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
            <h2 className="text-base font-bold tracking-heading text-ink">
              {t("settings.profile.heading")}
            </h2>
            <form action={profileAction} className="space-y-4">
              <div>
                <Label htmlFor="display_name">{t("settings.profile.displayName")}</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={initialDisplayName}
                  placeholder={t("settings.profile.displayNamePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="institution">{t("settings.profile.institution")}</Label>
                <Input
                  id="institution"
                  name="institution"
                  defaultValue={initialInstitution}
                  placeholder={t("settings.profile.institutionPlaceholder")}
                />
              </div>
              {profileState.error && (
                <p role="alert" className="text-sm text-danger">{profileState.error}</p>
              )}
              {profileState.success && (
                <p className="text-sm text-success">{t("settings.profile.saved")}</p>
              )}
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={profilePending}>
                  {profilePending ? t("settings.profile.saving") : t("settings.profile.save")}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Account */}
        {tab === "account" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-line bg-surface p-6 space-y-4">
              <h2 className="text-base font-bold tracking-heading text-ink">
                {t("settings.account.changeEmail")}
              </h2>
              <p className="text-sm text-ink-soft">
                {t("settings.account.currentEmail")} <strong>{currentEmail}</strong>
              </p>
              <form action={emailAction} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("settings.account.newEmail")}</Label>
                  <Input id="email" name="email" type="email" placeholder="new@example.com" />
                </div>
                {emailState.error && (
                  <p role="alert" className="text-sm text-danger">{emailState.error}</p>
                )}
                {emailState.success && (
                  <p className="text-sm text-success">{t("settings.account.emailSent")}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={emailPending}>
                    {emailPending ? t("settings.account.sending") : t("settings.account.changeEmailBtn")}
                  </Button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-6 space-y-4">
              <h2 className="text-base font-bold tracking-heading text-ink">
                {t("settings.account.changePassword")}
              </h2>
              <form action={pwAction} className="space-y-4">
                <div>
                  <Label htmlFor="password">{t("settings.account.newPassword")}</Label>
                  <Input id="password" name="password" type="password" placeholder={t("settings.account.newPasswordPlaceholder")} />
                </div>
                <div>
                  <Label htmlFor="confirm_password">{t("settings.account.confirmPassword")}</Label>
                  <Input id="confirm_password" name="confirm_password" type="password" placeholder={t("settings.account.confirmPasswordPlaceholder")} />
                </div>
                {pwState.error && (
                  <p role="alert" className="text-sm text-danger">{pwState.error}</p>
                )}
                {pwState.success && (
                  <p className="text-sm text-success">{t("settings.account.passwordSaved")}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={pwPending}>
                    {pwPending ? t("settings.account.savingPassword") : t("settings.account.changePasswordBtn")}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Appearance */}
        {tab === "appearance" && (
          <section className="rounded-2xl border border-line bg-surface p-6 space-y-5">
            <h2 className="text-base font-bold tracking-heading text-ink">
              {t("settings.appearance.heading")}
            </h2>
            <div className="space-y-4">
              {/* Theme */}
              <div className="rounded-xl border border-line bg-canvas px-4 py-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t("settings.appearance.theme")}</p>
                  <p className="text-xs text-ink-faint">{t("settings.appearance.themeDesc")}</p>
                </div>
                <div className="flex gap-2">
                  {THEMES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                        theme === value
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-ink"
                      )}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {label}
                      {theme === value && <Check size={13} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language picker */}
              <div className="rounded-xl border border-line bg-canvas px-4 py-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t("settings.appearance.language")}</p>
                  <p className="text-xs text-ink-faint">{t("settings.appearance.languageDesc")}</p>
                </div>
                <div className="flex gap-2">
                  {LANGUAGES.map(({ value, label, flag }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleLocaleChange(value)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                        optimisticLocale === value
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-ink",
                        isPending && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <span aria-hidden="true">{flag}</span>
                      {label}
                      {optimisticLocale === value && <Check size={13} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
