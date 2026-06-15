import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Latex } from "@/components/math/Latex";

const FEATURES = [
  {
    title: "Banco de questões",
    description:
      "Organize suas questões por disciplina, tópico e habilidade da BNCC. Reaproveite o que você já criou em qualquer lista nova.",
    icon: (
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z M8 8h8M8 12h8M8 16h5" />
    ),
  },
  {
    title: "Fórmulas em LaTeX",
    description:
      "Digite equações com um editor visual de matemática e veja o resultado renderizado instantaneamente, do jeito que sai impresso.",
    icon: <path d="M5 19 12 5l3 7 2-3 2 4M4 19h16" />,
  },
  {
    title: "PDF + gabarito",
    description:
      "Gere a prova em A4 pronta para impressão e, com um clique, a versão do gabarito com todas as respostas marcadas.",
    icon: <path d="M7 3.5h7l3 3v14a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-17Zm0 9 2 2 4-5" />,
  },
];

const STEPS = [
  {
    number: "01",
    title: "Crie sua lista",
    description: "Dê um nome, escolha a disciplina e comece do zero ou a partir de uma lista existente.",
  },
  {
    number: "02",
    title: "Monte as questões",
    description: "Escreva ou cole o enunciado, escolha o tipo (múltipla escolha, V/F, dissertativa…) e adicione fórmulas.",
  },
  {
    number: "03",
    title: "Imprima",
    description: "Acompanhe a pré-visualização em A4, ajuste o layout e exporte o PDF da prova e do gabarito.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-24">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Para professores
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              Listas e provas prontas para imprimir, em minutos.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
              Monte exercícios com fórmulas matemáticas, organize por assunto e gere o PDF da prova — com gabarito
              separado — sem precisar formatar nada à mão.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className={buttonStyles("accent", "lg")}>
                Criar conta gratuita
              </Link>
              <Link href="/login" className={buttonStyles("outline", "lg")}>
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-faint">Grátis para começar. Não precisa de cartão de crédito.</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div
              aria-hidden
              className="absolute inset-0 -rotate-6 rounded-lg border border-ink/10 bg-brand-soft shadow-sm"
            />
            <div
              aria-hidden
              className="absolute inset-0 rotate-2 rounded-lg border border-ink/10 bg-surface shadow-sm"
            />
            <div className="relative aspect-[210/297] w-full overflow-hidden rounded-lg border border-ink/10 bg-white p-6 shadow-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 27px, color-mix(in srgb, var(--color-line) 70%, transparent) 27px, color-mix(in srgb, var(--color-line) 70%, transparent) 28px)",
                  maskImage: "linear-gradient(to bottom, transparent 56px, black 56px)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 bottom-0 left-12 w-px bg-accent/25"
              />

              <div className="relative flex items-start justify-between border-b border-ink/10 pb-3">
                <div>
                  <p className="font-display text-base font-semibold text-ink">Lista de Exercícios</p>
                  <p className="text-xs text-ink-soft">Matemática · 9º ano · Equações</p>
                </div>
                <div className="rounded-md border border-ink/10 px-2 py-1 text-center text-[10px] leading-tight text-ink-soft">
                  Nota
                  <div className="mt-1 h-4 w-10 rounded-sm border border-ink/10" />
                </div>
              </div>

              <div className="relative mt-4 space-y-4 text-[12px] leading-relaxed text-ink">
                <div>
                  <p className="font-semibold">
                    1. Resolva a equação: <Latex text="$x^2 - 5x + 6 = 0$" />
                  </p>
                  <div className="mt-3 space-y-2.5">
                    <div className="h-px w-full bg-ink/15" />
                    <div className="h-px w-full bg-ink/15" />
                  </div>
                </div>

                <div>
                  <p className="font-semibold">
                    2. O valor aproximado de <Latex text="$\pi$" /> é:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-ink-soft">
                    <p>a) 3,10</p>
                    <p>b) 3,14</p>
                    <p>c) 3,41</p>
                    <p>d) 4,13</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold">3. Verdadeiro ou falso?</p>
                  <p className="mt-1 text-ink-soft">
                    Toda equação de 2º grau possui exatamente duas raízes reais. (&nbsp;&nbsp;&nbsp;)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/10 bg-surface/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Tudo o que você precisa</h2>
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

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Como funciona</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number}>
                  <p className="font-display text-3xl font-semibold text-accent">{step.number}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-ink/10 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Pronto para montar sua próxima prova?
            </h2>
            <p className="mt-3 text-ink-soft">Crie sua conta gratuita e monte sua primeira lista agora.</p>
            <div className="mt-6 flex justify-center">
              <Link href="/signup" className={buttonStyles("accent", "lg")}>
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink-faint">
        © {new Date().getFullYear()} PlataformaListas
      </footer>
    </div>
  );
}
