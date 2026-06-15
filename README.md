# PlataformaListas

Ferramenta para professores criarem listas de exercícios e provas em PDF: banco de questões, equações em LaTeX, layout de página personalizável e (em breve) geração assistida por IA.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Supabase (Postgres/Auth), KaTeX + MathLive, dnd-kit.
- **Idioma:** pt-BR. **Tamanho de página:** A4.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com as chaves do seu projeto Supabase — veja SETUP.md
npm run dev
```

Abra http://localhost:3000.

Sem as chaves do Supabase preenchidas, as páginas carregam mas login, cadastro e qualquer operação no banco vão falhar. Siga o **[SETUP.md](./SETUP.md)** para criar o projeto Supabase, rodar a migração e configurar o `.env.local`.

## Estrutura

```
src/
├── app/
│   ├── (auth)/login, (auth)/signup       # autenticação
│   ├── auth/callback                     # troca de código (magic link/OAuth)
│   ├── (app)/dashboard                   # lista de listas do usuário
│   ├── (app)/sheets/[id]                 # editor de uma lista
│   └── sheets/[id]/print(/gabarito)      # visualização para impressão/PDF
├── components/
│   ├── ui/                # Button, Input, Card, etc.
│   ├── math/               # Latex (KaTeX) e MathFieldInput (MathLive)
│   ├── sheets/              # editor de questões, lista, preview, documento
│   ├── auth/, dashboard/, layout/
├── lib/
│   ├── supabase/           # clientes browser/server (@supabase/ssr)
│   ├── actions/             # Server Actions (auth, sheets, questions)
│   ├── data/                 # leituras de dados (sheets)
│   ├── types/                # tipos do banco + tipos de questão
│   ├── sheets/defaults.ts    # configurações padrão de página/capa
│   └── ai/provider.ts         # interface de IA (Fase 4, ainda não implementada)
supabase/migrations/0001_init.sql  # schema + RLS
```

## Status

- **Fase 0 — Fundação:** concluída (auth, app shell, design system "caderno").
- **Fase 1 — MVP de lista:** concluída (CRUD de listas, editor de questões dos 6 tipos com LaTeX, reordenação, configurações de página, preview ao vivo, impressão/PDF de prova e gabarito).
- **Fases 2–5** (editor de layout, banco de questões, IA, polimento): em andamento.

## Deploy

Veja **[SETUP.md](./SETUP.md)** para o passo a passo de deploy na Vercel e limites dos planos gratuitos.
