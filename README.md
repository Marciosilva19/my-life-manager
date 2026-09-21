# My Life Manager

Aplicação web *mobile-first*, em português de Portugal e com valores em euros (€), que junta
**tarefas, horário, calendário, finanças, listas de compras e notas temporárias** num só lugar.

Primeira versão funcional para testes: **sem início de sessão**. Cada pessoa tem uma *workspace*
identificada por um endereço secreto (`/w/<identificador>`). Quem tiver esse link tem acesso aos
dados dessa área — e apenas dessa área.

---

## Índice

1. [Funcionalidades](#funcionalidades)
2. [Tecnologia e arquitetura](#tecnologia-e-arquitetura)
3. [Instalação local](#instalação-local)
4. [Configurar o Supabase](#configurar-o-supabase)
5. [Variáveis de ambiente](#variáveis-de-ambiente)
6. [Publicar no GitHub e na Vercel](#publicar-no-github-e-na-vercel)
7. [Segurança nesta fase](#segurança-nesta-fase)
8. [Estrutura do projeto](#estrutura-do-projeto)
9. [Preparado para o futuro](#preparado-para-o-futuro)

---

## Funcionalidades

| Ecrã | O que faz |
| --- | --- |
| **Hoje** | Cartões configuráveis (tarefas, próximo compromisso, resumo financeiro, próxima conta, compras, notas). Concluir tarefas num toque, reordenar e ocultar cartões, mensagem discreta de progresso. |
| **Tarefas** | Criar, editar, concluir e apagar. Título, descrição, data, hora, prioridade, categoria e recorrência (diária, semanal, mensal ou dias específicos). Agrupadas em Em atraso / Hoje / Esta semana / Mais tarde. Tarefas com hora aparecem no calendário. |
| **Calendário** | Horário em grelha escolar (semana), mais vistas de dia e mês, com transição suave entre níveis. Blocos com tipo, cor, local, notas e repetição semanal. |
| **Finanças** | Rendimentos e despesas, orçamento mensal por categoria, contas a pagar com avisos de vencimento, saldo do mês. Privado à workspace. |
| **Compras** | Várias listas, artigos com quantidade, categoria e notas, marcar como comprado e limpar concluídos. Link de partilha por lista. |
| **Notas temporárias** | Notas com validade, contagem de tempo restante, ligação opcional a uma tarefa, filtros (expira hoje / esta semana / todas) e eliminação automática. |
| **Definições** | Temas (rosa, lilás, azul, neutro, escuro), modo claro/escuro, início da semana, gestão dos cartões, link privado da área e dados de exemplo. |

---

## Tecnologia e arquitetura

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS 3** com temas por variáveis CSS
- **Supabase** (PostgreSQL) para persistência
- Sem autenticação nesta fase

### Como os dados são protegidos sem login

Todo o acesso à base de dados acontece **no servidor** (Server Components e Server Actions), com a
chave `service_role`. O browser nunca recebe chaves nem fala diretamente com o Supabase:

- cada leitura e cada escrita é filtrada pelo `workspace_id` resolvido a partir do identificador
  secreto do URL;
- o RLS está **ativo e sem políticas** em todas as tabelas, pelo que a chave pública (`anon`) não
  consegue ler nem escrever nada;
- os links de partilha das compras resolvem um *token* que devolve **apenas uma lista** — nunca
  tarefas, calendário, finanças ou outras listas.

---

## Instalação local

Requisitos: Node.js 18.18+ (recomendado 20+).

```bash
npm install
cp .env.example .env.local   # preencher com os dados do Supabase
npm run dev
```

A app fica em <http://localhost:3000>. Abre a página inicial, cria uma área e guarda o link.

Comandos úteis:

```bash
npm run build      # build de produção
npm run typecheck  # verificação de tipos
```

---

## Configurar o Supabase

1. Criar conta em <https://supabase.com> e clicar em **New project**.
   Guardar a palavra-passe da base de dados e escolher uma região europeia (ex.: `eu-west-3`).
2. No painel do projeto, abrir **SQL Editor → New query**.
3. Copiar todo o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   colar e carregar em **Run**. Isto cria as tabelas, os índices, a função de limpeza das notas e
   ativa o RLS.
4. Abrir **Project Settings → API** e copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** (em *Project API keys*) → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (opcional nesta fase)
5. *(Opcional)* Limpeza das notas expiradas também do lado do servidor:
   **Database → Extensions** → ativar `pg_cron` e correr no SQL Editor:

   ```sql
   select cron.schedule('purge-expired-notes', '*/15 * * * *',
                        $$select public.purge_expired_notes();$$);
   ```

   Sem isto a app já apaga as notas expiradas sempre que a workspace é aberta.

---

## Variáveis de ambiente

Criar `.env.local` a partir de `.env.example`:

| Variável | Onde se obtém | Obrigatória |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon public` | Não (reservada para o futuro) |

> A chave `service_role` dá acesso total à base de dados. Usar **apenas** em variáveis de servidor,
> nunca com o prefixo `NEXT_PUBLIC_`, e nunca a colocar no repositório.

---

## Publicar no GitHub e na Vercel

### 1. GitHub

```bash
git init
git add .
git commit -m "My Life Manager: primeira versão"
git branch -M main
git remote add origin https://github.com/<utilizador>/my-life-manager.git
git push -u origin main
```

O `.gitignore` já exclui `node_modules`, `.next` e todos os ficheiros `.env*`.

### 2. Vercel

1. Entrar em <https://vercel.com> com a conta do GitHub e escolher **Add New… → Project**.
2. Importar o repositório. A Vercel deteta Next.js automaticamente
   (*Framework Preset*: Next.js; *Build Command*: `next build`; *Install*: `npm install`).
3. Em **Environment Variables**, acrescentar para *Production*, *Preview* e *Development*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(opcional)*
4. **Deploy**. No fim, abrir o domínio gerado, criar a área e guardar o link
   (`https://<projeto>.vercel.app/w/<identificador>`).
5. Para adicionar ao telemóvel: abrir o link no Safari/Chrome → partilhar → *Adicionar ao ecrã
   principal*.

Não é preciso nenhuma configuração manual adicional: não há ficheiros de build especiais, nem
funções extra, nem passos pós-deploy.

---

## Segurança nesta fase

- O link da área **é a chave de acesso**: quem o tiver vê e edita tudo, incluindo as finanças.
  A app avisa disto nas Definições.
- Os links de partilha das listas de compras dão acesso **apenas a essa lista** e podem ser
  desativados a qualquer momento.
- As páginas partilhadas não são indexadas por motores de busca (`robots: noindex`).
- Não há integrações bancárias, cartões nem pagamentos reais.

---

## Estrutura do projeto

```
src/
  app/
    page.tsx                   # entrada: criar área
    w/[ws]/                    # área privada (Hoje, Tarefas, Calendário, Finanças, Compras, Notas, Mais, Definições)
    lista/[token]/             # lista de compras partilhada (público, só essa lista)
  components/
    cards/                     # cartões do ecrã Hoje
    calendar/                  # vistas de dia, semana e mês
    forms/                     # campos reutilizáveis dos formulários
    shopping/                  # corpo da lista e caixa de partilha
    ui/                        # Sheet, FormSheet, Field, EmptyState, ConfirmForm…
  lib/
    actions/                   # Server Actions (validação + escrita)
    data.ts                    # leituras, sempre filtradas pela workspace
    domain.ts                  # recorrências, agenda, orçamentos, vencimentos
    dates.ts / format.ts       # datas em pt-PT e valores em euros
    supabase.ts                # cliente Supabase exclusivo do servidor
supabase/migrations/0001_init.sql
```

---

## Preparado para o futuro

O modelo de dados e a arquitetura já contemplam os próximos passos:

- **Autenticação e convites** — tabela `workspace_members` (papéis `owner`/`editor`/`viewer`) e
  coluna `user_id` nas partilhas; basta trocar a resolução da workspace pelo utilizador autenticado
  e escrever as políticas de RLS.
- **Permissões por lista** — `list_shares` suporta vários links, papéis e revogação.
- **Notificações push/e-mail** — as contas a pagar, as tarefas com hora e as notas temporárias já
  têm datas próprias; falta apenas um trabalho agendado que leia essas datas.
- **Widgets nativos iOS/Android** — as leituras estão concentradas em `src/lib/data.ts`, o que
  permite expor uma API de leitura por workspace sem duplicar lógica.
