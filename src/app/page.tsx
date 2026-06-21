import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { buttonStyles } from "@/components/ui/Button";
import { SheetPreviewMock } from "@/components/marketing/SheetPreviewMock";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export default async function Home() {
  const locale = await getLocale();
  const t = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) =>
    translate(locale, key, vars);

  const STEPS = [
    { number: "01", title: t("landing.howItWorks.step1.title"), description: t("landing.howItWorks.step1.desc") },
    { number: "02", title: t("landing.howItWorks.step2.title"), description: t("landing.howItWorks.step2.desc") },
    { number: "03", title: t("landing.howItWorks.step3.title"), description: t("landing.howItWorks.step3.desc") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
            <div className="max-w-xl">
              <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-[-0.02em] text-ink sm:text-6xl">
                {t("landing.hero.heading1")}{" "}
                <span className="text-brand">{t("landing.hero.heading2")}</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{t("landing.hero.subhead")}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup" className={buttonStyles("primary", "lg")}>
                  {t("landing.hero.ctaPrimary")}
                </Link>
                <Link href="/login" className={buttonStyles("outline", "lg")}>
                  {t("landing.hero.ctaSecondary")}
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink-faint">{t("landing.hero.freeNote")}</p>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10 bg-[radial-gradient(closest-side,var(--color-brand-soft),transparent)] opacity-70"
              />
              <SheetPreviewMock t={t} />
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-t border-line bg-surface/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-md font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              {t("landing.capabilities.heading")}
            </h2>

            <div className="mt-10 grid gap-10 lg:grid-cols-[0.55fr_0.45fr]">
              <LatexShowcase t={t} />

              <div className="flex flex-col gap-8 lg:pt-2">
                <Capability title={t("landing.capabilities.bank.title")} description={t("landing.capabilities.bank.desc")} />
                <Capability title={t("landing.capabilities.export.title")} description={t("landing.capabilities.export.desc")} />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{t("landing.howItWorks.heading")}</h2>
            <div className="relative mt-10 grid gap-10 sm:grid-cols-3">
              <div
                aria-hidden="true"
                className="absolute top-6 right-0 left-0 hidden h-px bg-line sm:block"
              />
              {STEPS.map((step) => (
                <div key={step.number} className="relative">
                  <p className="relative z-10 inline-block bg-canvas pr-4 font-display text-4xl font-extrabold text-brand sm:bg-transparent sm:pr-0">
                    {step.number}
                  </p>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-line py-20 sm:py-24">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(120deg, var(--color-brand-dark) 0%, var(--color-brand) 55%, var(--color-accent) 100%)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/trasso-logo-watermark.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -bottom-24 w-[28rem] opacity-[0.12]"
          />
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t("landing.cta.heading")}</h2>
            <p className="mt-3 text-white/80">{t("landing.cta.subhead")}</p>
            <div className="mt-7 flex justify-center">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-brand-dark transition-opacity hover:opacity-90"
              >
                {t("landing.cta.button")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-faint">
        © {new Date().getFullYear()} trasso
      </footer>
    </div>
  );
}

type T = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => string;

function Capability({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
    </div>
  );
}

/** Static facsimile of the LaTeX editor: raw input above, the rendered result below. */
function LatexShowcase({ t }: { t: T }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
      <div className="border-b border-line bg-surface px-5 py-3">
        <h3 className="font-display text-xl font-bold text-ink">{t("landing.capabilities.latexHeading")}</h3>
      </div>
      <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-semibold text-ink-faint">{t("landing.capabilities.youType")}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] text-ink-soft">
            x = \frac{"{"}-b \pm \sqrt{"{"}b^2-4ac{"}"}{"}"}{"{"}2a{"}"}
          </pre>
        </div>
        <div className="flex flex-col p-5">
          <p className="text-xs font-semibold text-ink-faint">{t("landing.capabilities.itPrints")}</p>
          <div className="mt-2 flex flex-1 items-center justify-center rounded-lg bg-surface p-4">
            <p className="font-display text-lg text-ink">
              x ={" "}
              <span className="mx-1 inline-flex flex-col items-center text-center align-middle text-base leading-none">
                <span className="px-1">−b ± √(b² − 4ac)</span>
                <span className="w-full border-t border-ink/60 px-1">2a</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
