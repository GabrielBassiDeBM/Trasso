import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${translate(locale, "auth.login.heading")} — trasso` };
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
