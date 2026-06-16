import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonStyles } from "@/components/ui/Button";
import { signOutAction } from "@/lib/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/82 backdrop-blur-[8px]">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
          <Image src="/trasso-logo.svg" alt="trasso" width={52} height={52} className="h-13 w-13 rounded-xl" />
          <span className="hidden font-display text-2xl font-bold text-ink sm:inline">trasso</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              My sheets
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={buttonStyles("ghost", "sm")}>
                Sign out
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonStyles("ghost", "sm")}>
              Sign in
            </Link>
            <Link href="/signup" className={buttonStyles("primary", "sm")}>
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
