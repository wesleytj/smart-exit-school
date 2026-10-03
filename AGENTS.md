# Smart Exit School — AADS Operational Protocol

**Projeto:** Smart Exit School (SES)  
**Escopo:** Protocolo Operacional Compulsório de Agentes no Workspace  
**Status:** Ativo / Permanente  
**Autoridade:** Herda compulsoriamente a Constituição Global AADS (`~/.gemini/GEMINI.md`) e os Padrões Universais AADS 01–06.

---

## 1. Bootstrap Automático Compulsório (Regra Zero)

Em **toda e qualquer interação** neste workspace, o agente deve executar o seguinte ciclo mental antes de iniciar qualquer trabalho técnico, **sem depender de o usuário dizer "consulte o AADS"**:

1. **Identificação do Workspace:** Reconhecer que está operando no projeto *Smart Exit School*.
2. **Consulta às Regras Ativas:** Verificar as regras da Constituição Global, das regras do projeto (`AGENTS.md`, `GEMINI.md`, `.agents/rules/`) e o catálogo de Decision Gates.
3. **Localização do Estado Vigente:** Localizar a documentação AADS relevante para o escopo (`docs/`, `ai/aads/`, migrations em `supabase/migrations/`, inventário de QA em `docs/qa-inventory.md`, smoke em `docs/qa-production-smoke.md`).
4. **Determinação do Estado do Projeto:** Identificar o estado real da base de código e do ambiente (branch Git, status de migrations, build/lint).
5. **Verificação de Decision Gates:** Verificar se existe algum Decision Gate aberto, fechado ou pendente relacionado à ação solicitada.
6. **Verificação de Limitações Anteriores:** Checar se há decisões arquiteturais permanentes (ADRs), diretrizes de segurança ou salvaguardas que limitem a ação.
7. **Planejamento e Execução:** Prosseguir para o planejamento e execução técnica estritamente alinhado aos estados do Operating Model (States 01 a 09).

---

## 2. Hierarquia Normativa de Decisão

Em caso de divergência ou ambiguidade, prevalece estritamente a seguinte ordem de precedência:

1. **Instruções do Sistema / Plataforma** (limites invioláveis da infraestrutura do host).
2. **Regras de Segurança da Plataforma** (políticas de permissão e sandbox).
3. **Regras AADS Permanentes do Workspace** (Constituição AADS, `AGENTS.md`, SoT Map).
4. **Estado e Decision Gates AADS Vigentes** (gates ativos, status de aprovação registrado).
5. **Instruções Específicas do Usuário** (pedidos, refinamentos e direcionamentos do turno atual).
6. **Execução Técnica** (código, comandos, testes e mutações).

> **Invariante Suprema de Conflito:**  
> Se uma solicitação do usuário entrar em conflito direto com um Decision Gate AADS existente ou com a Constituição AADS, o agente **deve interromper o fluxo antes de executar a ação bloqueada** e explicar o conflito de forma transparente.

---

## 3. Autonomia Operacional e Política Git

A governança AADS **não deve ser interpretada como justificativa para pedir aprovação humana para cada comando ou leitura**.

O agente atua com **autonomia plena** para executar operações normais de engenharia dentro do workspace, desde que o gate correspondente esteja aberto ou a operação seja não-gated:

* **Inspeção e Diagnóstico Local (Automático):** `git status`, `git log`, `git diff`, `git show`, `git rev-parse`, `git branch`, `git remote`, `git ls-files`, `git describe`.
* **Sincronização Git Segura (Automático):** `git fetch` e `git pull` para sincronização normal de branch.
* **Operações de Entrega Git Autorizadas (Automático quando o ciclo AADS autorizar a entrega):**
  - Criação e checkout de branches de trabalho (`feature/*`, `bugfix/*`);
  - Commits de trabalho com mensagens semânticas rastreáveis;
  - `git push` para a branch de trabalho correspondente.
* **Qualidade e Validação Local (Automático):** `npm test`, `npm run lint`, `npm run build`, `npm run audit:db`, `npm run validate:rls`.
* **Inspeção Read-Only de Banco (Automático):** `npx supabase migration list`, `npx supabase inspect db ...` (sem flags de mutação).
* **Manipulação de Arquivos do Workspace (Automático):** Leitura de qualquer arquivo do projeto e edição de código/documentação autorizados pelo escopo de trabalho.

> **Princípio Canônico:**  
> A regra **NÃO** é baseada em uma denylist de comandos Git. A pergunta canônica a ser feita pelo agente é:  
> **"O AADS autorizou esta operação neste estado?"**  
> *(e não: "Este comando contém a palavra git?")*

---

## 4. Governança de Decision Gates

O agente deve compulsoriamente interromper o fluxo e solicitar aprovação humana formalizada antes de executar qualquer ação sujeita aos seguintes gatilhos:

| Gate | Gatilho Operacional | Comportamento Mandatório |
|---|---|---|
| **G-MERGE** | Integração/Merge na branch principal (`main`) ou `git push` direto para `main` | Preparar PR completo e aguardar comando/aprovação explícita de merge. |
| **G-DB** | Migrations, alteração de schema, DDL/DCL, triggers, policies ou estratégia de persistência | Detalhar impacto estrutural e reversibilidade; aguardar autorização formal antes de aplicar. |
| **G-IRREV** | Mutações irreversíveis em dados/infra de Produção ou reset de ambiente | Parar imediatamente e detalhar riscos críticos. |
| **G-DELETE** | Exclusão de rotas, endpoints públicos, funcionalidades ou tabelas | Confirmar escopo e plano de contingência; aguardar aprovação explícita. |
| **G-ARCH** | Alteração de arquitetura, novos padrões de pastas ou novas bibliotecas globais | Propor ADR e plano de impacto; aguardar aceite humano antes de codificar. |
| **G-SEC** | Autenticação, autorização, RLS permissivo, tokens, perfis ou secrets | Apresentar modelo de segurança e riscos; aguardar aprovação antes de alterar. |
| **G-HOTFIX** | Soluções emergenciais que desviam das etapas normais de validação | Declarar itens postergados e obter aval de risco. |
| **G-ADR** | Criação, modificação ou revogação de Decisão Arquitetural permanente | Redigir minuta da ADR e aguardar aprovação formal. |

---

## 5. Proteção de Produção e Banco de Dados

O AADS permanece como autoridade soberana para governar o ciclo de dados:
* É estritamente proibido rodar migrations, alterar schema, criar triggers ou modificar RLS em Produção sem `G-DB` explicitamente aprovado.
* É estritamente proibido rodar `supabase db push`, `supabase db reset`, `INSERT`, `UPDATE`, `DELETE` ou `TRUNCATE` diretamente em Produção via CLI ou scripts sem autorização formal e procedimento documentado.
* Testes de fumaça em Produção devem seguir estritamente o roteiro de [docs/qa-production-smoke.md](file:///c:/github_projects/smart-exit-school/docs/qa-production-smoke.md), operando exclusivamente via interface de usuário da aplicação.

---

## 6. Integração com Skills e Módulos de Domínio

O agente recorre às skills especializadas sob demanda:
* `ses-database-audit`: Para execução dos scripts de auditoria local de banco e RLS (`npm run audit:db`, `npm run validate:rls`).
* `ses-qa-smoke`: Para condução de testes de saída escolar e validação de fixtures.
* `aads-decision-gate`: Para formatação padronizada de blocos de decisão humana.
* `aads-state-reconciliation`: Para alinhamento de divergências entre código, migrations, banco e docs.
