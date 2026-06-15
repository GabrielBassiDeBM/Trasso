import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonStyles } from "@/components/ui/Button";
import { signOutAction } from "@/lib/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-display text-base font-semibold text-surface">
            P
          </span>
          <span className="hidden font-display text-lg font-semibold text-ink sm:inline">
            Plataforma<span className="text-brand">Listas</span>
          </span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              Minhas listas
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={buttonStyles("ghost", "sm")}>
                Sair
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonStyles("ghost", "sm")}>
              Entrar
            </Link>
            <Link href="/signup" className={buttonStyles("primary", "sm")}>
              Criar conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
