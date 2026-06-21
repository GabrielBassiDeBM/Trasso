import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { buttonStyles } from "@/components/ui/Button";
import { HeroSheet } from "@/components/marketing/HeroSheet";
import { PerforatedDivider } from "@/components/marketing/PerforatedDivider";
import { Reveal } from "@/components/marketing/Reveal";
import { QuestionStepLabel } from "@/components/marketing/QuestionStepLabel";
import { ProblemMcq } from "@/components/marketing/ProblemMcq";
import { ImportOrGenerate } from "@/components/marketing/ImportOrGenerate";
import { BankFilterDemo } from "@/components/marketing/BankFilterDemo";
import { CustomizeDemo } from "@/components/marketing/CustomizeDemo";
import { AccessibilityDemo } from "@/components/marketing/AccessibilityDemo";
import { ExportPreview } from "@/components/marketing/ExportPreview";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

export default async function Home() {
  const locale = await getLocale();
  const t = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) =>
    translate(locale, key, vars);
  const step = (n: number) => t("landing.step.label", { n });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero — the sheet itself is the hero, not a small accent beside the copy */}
        <section className="bg-ruled-paper relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-20 sm:pb-28">
            <p className="font-mono text-2xs tracking-[0.14em] text-brand-dark uppercase">{t("landing.hero.kicker")}</p>
            <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-ink sm:text-5xl">
              {t("landing.hero.heading1")} <span className="text-brand-dark">{t("landing.hero.heading2")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t("landing.hero.subhead")}</p>

            <div className="relative mt-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10 bg-[radial-gradient(closest-side,var(--color-brand-soft),transparent)] opacity-70"
              />
              <Reveal>
                <HeroSheet t={t} />
              </Reveal>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className={buttonStyles("primary", "lg")}>
                {t("landing.hero.ctaPrimary")}
              </Link>
              <Link href="#questao-1" className={buttonStyles("outline", "lg")}>
                {t("landing.hero.ctaSecondary")}
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-faint">{t("landing.hero.freeNote")}</p>
          </div>
        </section>

        <PerforatedDivider />

        {/* Questions 1–6 — each one demonstrates the feature it's asking about */}
        <div className="relative border-t border-line py-4 sm:py-6">
          <div
            aria-hidden="true"
            className="line-grow-v absolute top-0 bottom-0 left-[31px] hidden w-px bg-line sm:block"
          />

          <Question id="questao-1" label={step(1)} kicker={t("landing.q1.kicker")}>
            <ProblemMcq
              prompt={t("landing.q1.prompt")}
              options={[t("landing.q1.optionA"), t("landing.q1.optionB"), t("landing.q1.optionC"), t("landing.q1.optionD")]}
              note={t("landing.q1.note")}
            />
          </Question>

          <Question id="questao-2" label={step(2)} kicker={t("landing.q2.kicker")} heading={t("landing.q2.heading")}>
            <ImportOrGenerate
              importTitle={t("landing.q2.import.title")}
              importDesc={t("landing.q2.import.desc")}
              aiTitle={t("landing.q2.ai.title")}
              aiDesc={t("landing.q2.ai.desc")}
              aiPrompt={t("landing.q2.ai.promptText")}
              aiResultLabel={t("landing.q2.ai.resultLabel")}
              aiResultChip={t("landing.q2.ai.resultChip")}
            />
          </Question>

          <Question id="questao-3" label={step(3)} kicker={t("landing.q3.kicker")} heading={t("landing.q3.heading")}>
            <BankFilterDemo
              filters={[
                { label: t("landing.q3.filterSubject"), active: true },
                { label: t("landing.q3.filterTopic") },
                { label: t("landing.q3.filterDifficulty"), active: true },
                { label: t("landing.q3.filterType") },
                { label: t("landing.q3.filterSource") },
                { label: t("landing.q3.filterSkills") },
              ]}
              resultsLabel={t("landing.q3.resultsLabel")}
              addLabel={t("landing.q3.addLabel")}
              results={[t("landing.bank.chip1"), t("landing.bank.chip2"), t("landing.bank.chip3")]}
            />
          </Question>

          <Question id="questao-4" label={step(4)} kicker={t("landing.q4.kicker")} heading={t("landing.q4.heading")}>
            <CustomizeDemo
              difficultyLabel={t("landing.q4.difficultyLabel")}
              difficulties={[
                t("landing.q4.difficulty.easy"),
                t("landing.q4.difficulty.medium"),
                t("landing.q4.difficulty.hard"),
              ]}
              activeDifficulty={1}
              shuffleLabel={t("landing.q4.shuffleLabel")}
              versionLabel={t("landing.q4.versionLabel")}
              regenerateLabel={t("landing.q4.regenerateLabel")}
            />
          </Question>

          <Question id="questao-5" label={step(5)} kicker={t("landing.q5.kicker")} heading={t("landing.q5.heading")}>
            <AccessibilityDemo
              modes={[
                { key: "standard", label: t("landing.q5.mode.standard") },
                { key: "dyslexia", label: t("landing.q5.mode.dyslexia") },
                { key: "adhd", label: t("landing.q5.mode.adhd") },
                { key: "autism", label: t("landing.q5.mode.autism") },
                { key: "lowVision", label: t("landing.q5.mode.lowVision") },
              ]}
              previewText={t("landing.preview.q4")}
            />
          </Question>

          <Question id="questao-6" label={step(6)} kicker={t("landing.q6.kicker")} heading={t("landing.q6.heading")}>
            <ExportPreview
              pdfLabel={t("landing.q6.pdfLabel")}
              keyLabel={t("landing.q6.keyLabel")}
              versionsLabel={t("landing.q6.versionsLabel")}
            />
            <Reveal delayMs={120}>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t("landing.q6.note")}</p>
            </Reveal>
          </Question>
        </div>

        {/* Final question — the CTA */}
        <section className="relative overflow-hidden border-t border-line py-20 sm:py-24">
          <div
            aria-hidden="true"
            className="animate-gradient-drift absolute inset-0 -z-10"
            style={{ background: "linear-gradient(120deg, var(--color-brand-dark) 0%, var(--color-brand) 55%, var(--color-accent) 100%)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/trasso-logo-watermark.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -bottom-24 w-[28rem] opacity-[0.12]"
          />
          <Reveal className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <p className="font-mono text-2xs tracking-[0.14em] text-white/70 uppercase">{t("landing.step.final")}</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{t("landing.final.prompt")}</h2>
            <div className="mt-7 flex flex-col items-center gap-3">
              <p className="text-sm text-white/60 line-through">{t("landing.final.optionA")}</p>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-brand-dark transition-opacity hover:opacity-90"
              >
                {t("landing.final.optionB")}
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-faint">
        © {new Date().getFullYear()} trasso
      </footer>
    </div>
  );
}

function Question({
  id,
  label,
  kicker,
  heading,
  children,
}: {
  id: string;
  label: string;
  kicker: string;
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-10 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="sm:pl-16">
          <Reveal>
            <QuestionStepLabel label={label} kicker={kicker} />
            {heading && (
              <h2 className="mt-3 max-w-2xl font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
                {heading}
              </h2>
            )}
          </Reveal>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
