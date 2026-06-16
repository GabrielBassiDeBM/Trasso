import { redirect } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/orgs";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token;

  if (!token) redirect("/dashboard");

  const result = await acceptInviteAction(token);

  if (result.error) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm max-w-sm w-full">
          <p className="font-semibold text-ink">{result.error}</p>
          <a href="/dashboard" className="mt-4 inline-block text-sm text-brand hover:underline">
            Ir para o dashboard
          </a>
        </div>
      </div>
    );
  }

  // acceptInviteAction already redirects on success
  return null;
}
