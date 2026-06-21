import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${translate(locale, "auth.signup.heading")} — trasso` };
}

export default function SignupPage() {
  return <SignupForm />;
}
