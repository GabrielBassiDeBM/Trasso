import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    title: "Question Bank",
    description:
      "Build a reusable library of questions organized by subject and topic. Pull any question into a new sheet in one click.",
    icon: (
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z M8 8h8M8 12h8M8 16h5" />
    ),
  },
  {
    title: "LaTeX Math",
    description:
      "Type equations with a visual math editor and see them rendered instantly, exactly as they'll appear in print.",
    icon: <path d="M5 19 12 5l3 7 2-3 2 4M4 19h16" />,
  },
  {
    title: "PDF + Answer Key",
    description:
      "Export a print-ready A4 PDF and generate a complete answer key in one click. Works for every question type.",
    icon: <path d="M7 3.5h7l3 3v14a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-17Zm0 9 2 2 4-5" />,
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create a sheet",
    description: "Give it a title, choose the type (test, problem set, practice test), and start from scratch or generate with AI.",
  },
  {
    number: "02",
    title: "Add questions",
    description: "Write or paste the prompt, pick the format (multiple choice, open answer, T/F, essay...) and add math formulas.",
  },
  {
    number: "03",
    title: "Print",
    description: "Preview the A4 layout, adjust the design, and export the PDF with a matching answer key.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex min-h-[600px] items-center overflow-hidden lg:min-h-[680px]">
          <Image
            src="/FundoHero.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/92 to-canvas/30" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" />

          <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
            <div className="max-w-xl">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                For SAT & AP Teachers
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl lg:text-[3.5rem]">
                Tests and problem sets ready to print, in minutes.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
                Build SAT and AP STEM worksheets with math formulas, organize by topic, and export a clean PDF with a
                separate answer key — no manual formatting.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className={buttonStyles("primary", "lg")}>
                  Create free account
                </Link>
                <Link href="/login" className={buttonStyles("outline", "lg")}>
                  Sign in
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink-faint">Free to start. No credit card required.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-line bg-surface/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Everything you need</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="p-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-9 w-9 text-brand"
                  >
                    {feature.icon}
                  </svg>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">How it works</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number}>
                  <p className="font-display text-3xl font-semibold text-brand">{step.number}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Ready to build your next test?
            </h2>
            <p className="mt-3 text-ink-soft">Create a free account and make your first sheet right now.</p>
            <div className="mt-6 flex justify-center">
              <Link href="/signup" className={buttonStyles("primary", "lg")}>
                Create free account
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
