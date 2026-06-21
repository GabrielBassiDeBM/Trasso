import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonStyles } from "@/components/ui/Button";
import { signOutAction } from "@/lib/actions/auth";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export async function Navbar() {
  const supabase = await createClient();
  const [{ data }, locale] = await Promise.all([supabase.auth.getUser(), getLocale()]);
  const user = data.user;
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/82 backdrop-blur-[8px]">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-3 rounded-lg transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <Image src="/trasso-logo.svg" alt="trasso" width={52} height={52} className="h-13 w-13 rounded-xl" />
          <span className="hidden font-display text-2xl font-bold text-ink sm:inline">trasso</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/dashboard"
              className="rounded-md px-1 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {t("nav.mySheets")}
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={buttonStyles("ghost", "sm")}>
                {t("nav.signOut")}
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-1 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {t("nav.signIn")}
            </Link>
            <Link href="/signup" className={buttonStyles("primary", "sm")}>
              {t("nav.signUp")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
