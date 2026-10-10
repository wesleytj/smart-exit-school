# Guia de Instalação e Execução — Smart Exit School

Guia oficial para configuração, inicialização e validação do ambiente de desenvolvimento local do Smart Exit School.

---

## 1. Pré-requisitos

| Requisito | Versão Recomendada | Finalidade |
|---|---|---|
| **Node.js** | 20.x ou 22.x LTS (recomendado: `22.x`) | Runtime JavaScript para tooling e servidor Vite |
| **npm** | 10.x+ | Gerenciador de pacotes do projeto |
| **Git** | 2.40+ | Controle de versão |
| **Docker Desktop** | Mais recente (em execução) | **Obrigatório** para executar os containers do Supabase local |
| **Supabase CLI** | Mais recente | Gerenciamento de banco, migrations e Edge Functions via `npx supabase` |
| **Deno** | Embutido na CLI | O runtime Deno 2 para as Edge Functions é gerenciado diretamente pela Supabase CLI |
| **Navegador Moderno** | Chrome, Edge, Firefox, Safari | Renderização com suporte a ES Modules e DevTools |

---

## 2. Passo a Passo de Instalação

### Passo 2.1: Clonar o Repositório
```bash
git clone https://github.com/wesleytj/smart-exit-school.git
cd smart-exit-school
```

### Passo 2.2: Instalar Dependências
```bash
npm install
```

### Passo 2.3: Configurar Variáveis de Ambiente
Crie o arquivo `.env.local` na raiz do projeto (já ignorado pelo `.gitignore`):

```bash
cp .env.example .env.local
```

Preencha com os dados do seu Supabase local (ou remoto):
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sua-chave-anon-local
SUPABASE_AUTH_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

> **Nota sobre `SUPABASE_AUTH_JWT_SECRET`:** No ambiente local do Supabase, o segredo padrão gerado em `supabase/.temp/jwt_secret` é `super-secret-jwt-token-with-at-least-32-characters-long`. Ele é consumido pelas suítes de teste de integração e pelas Edge Functions locais para cunhagem e validação dos tokens de impersonation.

---

## 3. Inicializar o Supabase Local (Obrigatório)

O Smart Exit School depende ativamente do Supabase PostgreSQL para autenticação, catálogo de escolas, portões, turmas, alunos e eventos de saída. O banco **não é opcional**.

Certifique-se de que o **Docker Desktop** está em execução e execute:

```bash
# Iniciar a infraestrutura de containers locais do Supabase
npx supabase start
```

Após a inicialização, o console exibirá as URLs e credenciais locais:
* **API URL:** `http://127.0.0.1:54321`
* **GraphQL URL:** `http://127.0.0.1:54321/graphql/v1`
* **DB URL:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
* **Studio URL:** `http://127.0.0.1:54323`
* **anon key:** `sb_publishable_...` (copie para a chave `VITE_SUPABASE_ANON_KEY` no `.env.local`)

### Aplicar Migrations e Baseline Seed
```bash
npx supabase db reset
```
Esse comando aplica as 22 migrations versionadas e executa `supabase/seed.sql`, populando a escola de desenvolvimento (`smart-exit-dev-school`), níveis acadêmicos, turmas de exemplo e portões.

---

## 4. Executar as Edge Functions Locais (Deno)

Para habilitar a funcionalidade de personificação de usuário (Impersonation) em desenvolvimento, execute o runtime de Edge Functions em um terminal separado:

```bash
npx supabase functions serve --no-verify-jwt
```

Isso disponibilizará os endpoints:
* `http://127.0.0.1:54321/functions/v1/impersonate-user`
* `http://127.0.0.1:54321/functions/v1/end-impersonation`

---

## 5. Executar o Servidor de Desenvolvimento do Frontend

Em outro terminal, inicie a aplicação web:

```bash
npm run dev
```

* **Aplicação Web:** `http://localhost:5173`
* **Painel Supabase Studio:** `http://localhost:54323`

---

## 6. Scripts de Validação e Qualidade

Antes de enviar commits ou abrir Pull Requests, valide seu ambiente com a suíte oficial:

```bash
# 1. Análise estática de código com ESLint 10
npm run lint

# 2. Suíte de testes unitários e de integração automatizados (Node Test Runner - 147 testes)
npm test

# 3. Auditoria estrutural do schema, policies e seed baseline (Database Auditor v1)
npm run audit:db

# 4. Validação formal das políticas de Row Level Security
npm run validate:rls

# 5. Compilação de teste do bundle de produção
npm run build
```

---

## 7. Solução de Problemas Rápidos

* **Docker não iniciado:** Se `npx supabase start` falhar, certifique-se de que o Docker Desktop está aberto e inicializado no sistema.
* **Portas em conflito (54321, 54322, 54323):** Verifique se não há instâncias antigas de PostgreSQL ou outros containers rodando.
* **Limpar cache do navegador:** Se houver resíduos locais antigos em `localStorage`, limpe via DevTools (`localStorage.clear()`).
