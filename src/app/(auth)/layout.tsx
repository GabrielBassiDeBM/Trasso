import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-display text-lg font-semibold text-surface">
            P
          </span>
          <span className="font-display text-xl font-semibold text-ink">
            Plataforma<span className="text-brand">Listas</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
