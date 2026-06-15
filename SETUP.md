# SETUP — coisas que só você pode fazer

Checklist do que falta configurar fora do código: projeto Supabase, chaves de IA e deploy. O app builda e roda sem isso, mas login/cadastro e qualquer leitura/escrita no banco vão falhar até o Supabase estar configurado.

## 1. Criar o projeto Supabase (gratuito)

1. Crie uma conta em https://supabase.com e clique em **New project** (plano Free).
2. Anote a **região** (escolha algo próximo do Brasil, ex. South America/São Paulo se disponível) e uma senha forte para o banco (você não vai precisar dela no dia a dia, mas guarde).
3. Aguarde o projeto provisionar (~2 min).

### 1.1 Rodar as migrações

1. No painel do projeto, abra **SQL Editor**.
2. Cole o conteúdo de `supabase/migrations/0001_init.sql` (deste repo) e clique em **Run**.
3. Isso cria as tabelas (`profiles`, `sheets`, `sheet_questions`, `questions`, `subjects`, `topics`, `assets`, `ai_usage`), as policies de RLS, os grants do PostgREST e o trigger que cria uma linha em `profiles` no cadastro.
4. Em seguida, cole o conteúdo de `supabase/migrations/0002_storage.sql` e clique em **Run**. Isso cria o bucket público `logos` (usado pelo editor de capa para o upload do logo da escola) com as policies de RLS por usuário.

### 1.2 Copiar as chaves para `.env.local`

1. Vá em **Project Settings > API**.
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (não é usada no código ainda — fica reservada para tarefas administrativas futuras; nunca exponha no client)
3. Copie `.env.local.example` para `.env.local` (se ainda não fez) e cole os valores.

```bash
cp .env.local.example .env.local
```

4. Rode `npm run dev` e teste: cadastro (`/signup`) → deve criar o usuário e a linha em `profiles` → redireciona para `/dashboard`.

## 2. Chaves de IA (Fase 4 — ainda não usadas pelo app)

Não bloqueiam o uso atual (Fases 0–1). Quando a Fase 4 (IA) for implementada, essas chaves entram em `.env.local` (local) e nas env vars do projeto na Vercel (produção).

- **Gemini (provedor padrão, gratuito):**
  1. Acesse https://aistudio.google.com/app/apikey.
  2. Crie uma API key (não precisa cartão de crédito).
  3. Cole em `GEMINI_API_KEY`.
  4. Limite do plano gratuito: ~1.500 requisições/dia — suficiente para desenvolvimento e demos.

- **Groq (opcional, caminho alternativo de OCR/extração):**
  1. Acesse https://console.groq.com/keys e crie uma key.
  2. Cole em `GROQ_API_KEY`. Pode deixar em branco se não for usar.

## 3. Deploy na Vercel

1. Crie uma conta em https://vercel.com (pode usar login do GitHub).
2. **Import Project** → conecte o repositório do GitHub deste projeto (ou rode `vercel` via CLI a partir da raiz do repo).
3. Em **Settings > Environment Variables**, adicione as mesmas variáveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marcar como secreta)
   - `NEXT_PUBLIC_SITE_URL` → a URL pública do deploy (ex. `https://plataforma-listas.vercel.app`) — usada para montar os links de magic link/callback de auth.
   - `GEMINI_API_KEY` / `GROQ_API_KEY` quando a Fase 4 estiver pronta.
4. Clique em **Deploy**.

### Caveat do plano Hobby (gratuito) da Vercel

- **Uso não-comercial apenas.** No momento em que isso virar um produto real com usuários (especialmente pagantes), os termos da Vercel exigem o plano **Pro (~$20/mês)**. Para construir e validar, o Hobby é suficiente.
- **Timeout de função serverless de 10s.** O MVP gera o PDF no navegador (via impressão), então isso não é um problema agora. Vai importar se/quando a Fase 5 adicionar geração de PDF no servidor (Puppeteer) — nesse caso, considere o plano Pro ou Cloudflare Pages (que permite uso comercial no plano gratuito, com um pouco mais de configuração para Next.js).

## 4. Opcional: login com Google (OAuth)

Hoje o app tem e-mail/senha e magic link. Para adicionar "Entrar com Google":

1. No Supabase, vá em **Authentication > Providers > Google** e ative.
2. Crie um OAuth Client ID no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (tipo "Web application").
3. Em **Authorized redirect URIs**, adicione a URL de callback que o Supabase mostra na tela do provider (algo como `https://<seu-projeto>.supabase.co/auth/v1/callback`).
4. Cole o **Client ID** e **Client Secret** gerados de volta na tela do provider no Supabase e salve.
5. Avise para adicionarmos o botão "Entrar com Google" em `LoginForm`/`SignupForm` (chama `supabase.auth.signInWithOAuth({ provider: "google" })`).

## 5. Limites dos planos gratuitos — o que observar

- **Supabase Free:** 500 MB de banco, 1 GB de storage, 5 GB de egress/mês, até 50.000 usuários ativos/mês, 2 projetos ativos. **Sem restrição de uso comercial.** Atenção: um projeto gratuito **pausa após 7 dias sem atividade** — para reativar, abra o dashboard do projeto e clique em "Restore"/"Resume". Para evitar a pausa, pode-se configurar um ping periódico (ex. cron externo chamando a API a cada poucos dias).
- **Vercel Hobby:** ~100 GB de banda/mês, ver caveat de uso comercial e timeout acima.
- **Gemini Flash (free tier):** ~1.500 requisições/dia, sem cartão. Os termos do free tier podem incluir uso dos prompts para treinamento — não enviar dados sensíveis de alunos. Trocar para Claude/outro provedor pago depois é uma mudança isolada em `src/lib/ai/provider.ts`.

---

**Resumo:** o app funciona 100% de graça nesta fase (Supabase Free + Vercel Hobby). O único gasto aparece em lançamento real: Vercel Pro (~$20/mês) para uso comercial, e custo por token de IA *se* sair do free tier por qualidade/privacidade.
