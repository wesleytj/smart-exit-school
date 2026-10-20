# Governança de Ambientes — Smart Exit School

## 1. Visão Geral

O Smart Exit School opera com segregação de ambientes para garantir governança, previsibilidade e isolamento operacional. Embora não existam clientes finais ativos em produção neste momento, a separação formal entre os ambientes é obrigatória segundo o Operating Model da plataforma.

A arquitetura desacoplada distribui a aplicação entre o frontend na **Vercel** e os serviços de backend/banco de dados no **Supabase Cloud**.

---

## 2. Matriz Canônica de Ambientes

| Parâmetro | Desenvolvimento Local (Dev) | Produção (Production) |
|---|---|---|
| **Finalidade** | Desenvolvimento de features, testes unitários, suíte E2E completa e auditoria de schema | Operação real, telões de TV em produção e testes de fumaça (smoke) |
| **Frontend URL** | `http://localhost:5173` | `https://smart-exit-school.vercel.app` |
| **Supabase Project Ref** | `smart-exit-school` (Docker local) | `yantfnekslrzhussewdh` |
| **Supabase URL** | `http://127.0.0.1:54321` | `https://yantfnekslrzhussewdh.supabase.co` |
| **Arquivo de Configuração Local** | `.env.local` / `.env.e2e` | `.env.production` (template: `.env.production.example`) |
| **Suíte de Testes Permitida** | Unitários, integração e E2E local (8/8 cenários) | **Apenas Smoke Tests read-only** |
| **Mutações de Banco** | Migrations locais, seed baseline e reset de fixtures local | **Proibido** mutação via testes; apenas migrations aprovadas (`G-DB`) |

---

## 3. Arquivos de Configuração de Ambiente

O arquivo com credenciais reais (`.env.production`) é estritamente ignorado pelo Git em [.gitignore](../.gitignore) e nunca deve ser commitado.

Para configurar novas instâncias ou máquinas de desenvolvimento, copie o template versionado:

```bash
# Para o ambiente de produção
cp .env.production.example .env.production
```

### Estrutura do `.env.production`
```env
# .env.production
VITE_SUPABASE_URL=https://yantfnekslrzhussewdh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_production>
E2E_BASE_URL=https://smart-exit-school.vercel.app
```

---

## 4. Como Alternar entre Ambientes no Frontend Local

O Vite carrega variáveis baseando-se no modo de execução (`--mode`):

1. **Rodar localmente conectado ao Supabase Local:**
   ```bash
   npm run dev
   ```
   *(utiliza `.env.local` por padrão)*

2. **Rodar localmente conectado a Produção (modo leitura/inspeção):**
   ```bash
   npx vite --mode production
   ```
   *(carrega `.env.production` e aponta para o projeto `yantfnekslrzhussewdh`)*

---

## 5. Uso dos Ambientes nas Suítes de Testes

### Desenvolvimento Local: Ambiente da Suíte E2E Completa
A suíte E2E completa (8 cenários exercitando login, mutação de alunos, criação e cancelamento de chamadas e alternância de anos letivos) executa **exclusivamente contra o ambiente de desenvolvimento local**.
- **Comando:** `npm run test:e2e`
- **Mutações controladas:** Antes da execução no ambiente local, o estado deve ser restabelecido pelo script versionado de reset (`npm run test:e2e:reset-fixtures`), que atua exclusivamente sobre o Supabase Local (`http://127.0.0.1:54321`).

### Produção: Ambiente Exclusivo de Smoke Tests Read-Only
> **REGRA INVIOLÁVEL DE SEGURANÇA:**  
> A suíte E2E completa **NUNCA** roda em produção. Nenhuma escrita, cadastro fictício ou mutação de dados é permitida na base de produção através de rotinas automatizadas de teste.

O ambiente de Produção aceita unicamente os **Smoke Tests de Produção** (`tests/smoke/production.spec.ts`):
- Testes 100% read-only;
- Validação de disponibilidade de página (HTTP 200);
- Validação de integridade do título da aplicação;
- Verificação de conectividade com as bordas e edge functions.
- **Comando:** `npm run test:smoke:production`

---

## 6. Governança de CI/CD por Ambiente

- **Workflow `smoke-production.yml`:** Executado de forma agendada (cron diário) ou manual, atestando a saúde ininterrupta da aplicação em Produção.
