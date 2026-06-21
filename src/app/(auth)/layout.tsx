import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <LocaleProvider locale={locale}>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center justify-center gap-3.5">
            <Image src="/trasso-logo.svg" alt="trasso" width={72} height={72} className="h-18 w-18 rounded-2xl" />
            <span className="font-display text-3xl font-bold text-ink">trasso</span>
          </Link>
          {children}
        </div>
      </div>
    </LocaleProvider>
  );
}
