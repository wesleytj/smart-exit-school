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
| **Supabase CLI** | Mais recente | Gerenciamento de migrations e ambiente local via `npx supabase` |
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
```

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
Esse comando aplica as 18 migrations versionadas e executa `supabase/seed.sql`, populando a escola de desenvolvimento (`smart-exit-dev-school`), níveis acadêmicos, turmas de exemplo e portões.

---

## 4. Executar o Servidor de Desenvolvimento

```bash
npm run dev
```

* **Aplicação Web:** `http://localhost:5173`
* **Painel Supabase Studio:** `http://localhost:54323`

---

## 5. Scripts de Validação e Qualidade

Antes de enviar commits ou abrir Pull Requests, valide seu ambiente com a suíte oficial:

```bash
# 1. Análise estática de código com ESLint 10
npm run lint

# 2. Suíte de testes unitários automatizados (Node Test Runner)
npm test

# 3. Auditoria estrutural do schema, policies e seed baseline (Database Auditor v1)
npm run audit:db

# 4. Validação formal das políticas de Row Level Security
npm run validate:rls

# 5. Compilação de teste do bundle de produção
npm run build
```

---

## 6. Solução de Problemas Rápidos

* **Docker não iniciado:** Se `npx supabase start` falhar, certifique-se de que o Docker Desktop está aberto e inicializado no sistema.
* **Portas em conflito (54321, 54322, 54323):** Verifique se não há instâncias antigas de PostgreSQL ou outros containers rodando.
* **Limpar cache do navegador:** Se houver resíduos locais antigos em `localStorage`, limpe via DevTools (`localStorage.clear()`).
