import { redirect } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/orgs";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token;

  if (!token) redirect("/dashboard");

  const [result, locale] = await Promise.all([acceptInviteAction(token), getLocale()]);

  if (result.error) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm max-w-sm w-full">
          <p className="font-semibold text-ink">{result.error}</p>
          <a href="/dashboard" className="mt-4 inline-block text-sm text-brand hover:underline">
            {translate(locale, "invite.goToDashboard")}
          </a>
        </div>
      </div>
    );
  }

  // acceptInviteAction already redirects on success
  return null;
}
