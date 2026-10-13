# Testes End-to-End (E2E) — Smart Exit School

## 1. Visão Geral

Os testes End-to-End (E2E) no Smart Exit School validam o comportamento integrado do sistema através de fluxos de ponta a ponta simulando a experiência de clientes reais. Eles exercitam as camadas do sistema a partir de conexões de clientes autenticados via JWT (GoTrue), validando:
- Autenticação corporativa e resolução de sessões;
- Isolamento multi-tenant estrito governado por Row Level Security (RLS);
- Transações atômicas e RPCs do PostgreSQL (`activate_school_year`, `archive_old_pickup_events`, `accept_school_invitation`);
- Ciclo de vida completo das operações escolares (alunos, turmas, chamadas de portão e telão);
- Trilha imutável de auditoria de suporte e impersonation.

A camada E2E constitui a garantia de regressão fundamental pré-Ciclo E (Histórico Operacional e Auditoria Avançada).

---

## 2. Arquitetura e Frameworks

Alinhando-se aos princípios de eficiência e anti-improvisação da arquitetura do projeto:
- **Runner de Execução:** Node.js Test Runner nativo (`node --test`), sem introdução de dependências externas pesadas ou instáveis.
- **Cliente de Integração:** `@supabase/supabase-js`, conectando-se diretamente aos endpoints HTTP do Supabase local (PostgREST, GoTrue Auth e RPCs).
- **Localização dos Arquivos:** `src/e2e/`, segregados das suítes unitárias e de integração de serviços.
- **Convenção de Nomenclatura:** `*.e2e.test.js`.

---

## 3. Pré-requisitos de Ambiente

Os testes E2E necessitam do ambiente local do Supabase em execução com as migrações aplicadas e as fixtures multi-tenant carregadas.

1. **Supabase Local em Execução:**
   ```bash
   npx supabase start
   ```
   * PostgREST: `http://127.0.0.1:54321`
   * PostgreSQL: `127.0.0.1:54322`

2. **Arquivo de Variáveis Locais (`.env.local`):**
   Deve conter as chaves canônicas da CLI local do Supabase:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<sua-anon-key-local>
   SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-local>
   ```

3. **Carga das Fixtures Multi-Tenant:**
   ```powershell
   Get-Content supabase/seed-multi-tenant.sql -Raw | docker exec -i supabase_db_smart-exit-school psql -U postgres -d postgres
   ```

---

## 4. Como Executar

### Execução Completa da Suíte E2E
```bash
npm run test:e2e
```

### Execução de um Cenário E2E Específico
```bash
node --test src/e2e/studentLifecycle.e2e.test.js
node --test src/e2e/multiTenantIsolation.e2e.test.js
```

---

## 5. Matriz Canônica de Cenários E2E

A suíte cobre os 8 fluxos críticos do sistema através de clientes autenticados:

| ID | Cenário | Atores / Roles | Fluxo Principal | Assertivas Críticas | Arquivo |
|---|---|---|---|---|---|
| **E2E-01** | Gestão de Membros e Convites | Platform Admin / Diretor Escolar | Criação de instituição escolar, emissão de convite de membro com token criptográfico e aceite atômico do novo membro. | Convite gerado em `school_invitations`, RPC `accept_school_invitation` vincula profile e `school_members` com status `active`. | `authAndMembership.e2e.test.js` |
| **E2E-02** | Ciclo de Vida do Aluno | Operador Escolar (`authenticated`) | Cadastro de estudante, provisionamento de matrícula no ano letivo ativo e vinculação de turma acadêmica. | Registro persistido em `students`, `student_enrollments` e `student_group_assignments`. Consulta com joins normalizados. | `studentLifecycle.e2e.test.js` |
| **E2E-03** | Ciclo Completo de Chamada | Operador de Portão + Telão TV | Disparo de chamada de retirada de aluno no portão, consumo pela rota do Telão TV e confirmação de entrega do aluno. | Evento nasce `status = 'called'`, telão lê chamada ativa por polling, confirmação transiciona para `completed` com `completed_at`. | `pickupCallLifecycle.e2e.test.js` |
| **E2E-04** | Cancelamento Operacional de Chamada | Operador de Portão | Cancelamento de chamada acionada por engano na fila ativa. | Status transiciona `called` → `cancelled`, `cancelled_at` preenchido, aluno liberado imediatamente na lista para nova chamada. | `pickupCallLifecycle.e2e.test.js` |
| **E2E-05** | Ativação Atômica de Ano Letivo | Gestor Escolar | Alternância do ano letivo ativo de uma escola que possui múltiplos anos cadastrados. | RPC `activate_school_year` executa em transação sob lock `FOR UPDATE`. O ano anterior fica `is_active = false` e o novo `is_active = true`. Exatamente 1 ativo. | `schoolYearActivation.e2e.test.js` |
| **E2E-06** | Isolamento Multi-Tenant (Anti-Leak) | Usuário Tenant Alpha vs Usuário Tenant Beta | Tentativa de leitura, escrita, atualização ou deleção cruzada entre tenants escolares distintos. | RLS bloqueia 100% de acesso cruzado: consultas a alunos/portões/turmas do outro tenant retornam 0 linhas; mutações diretas são bloqueadas. | `multiTenantIsolation.e2e.test.js` |
| **E2E-07** | Arquivamento Histórico de Chamadas | Rotina de Manutenção (`service_role`) | Invocação da RPC de expurgo `archive_old_pickup_events` para transferir chamadas antigas para a tabela fria de arquivo. | Eventos finalizados/cancelados migram para `pickup_events_archive`; chamadas em andamento `called` **nunca** são arquivadas; tenant lê arquivo via RLS. | `archiveAndAudit.e2e.test.js` |
| **E2E-08** | Auditoria e Impersonation de Plataforma | Platform Admin (`is_platform_admin`) | Iniciação de sessão de suporte/impersonation de usuário de escola com restrições e auditoria imutável. | Log gravado em `impersonation_audit_logs`, usuário impersonado não escala privilégio de admin, encerramento registra `ended_at`. | `archiveAndAudit.e2e.test.js` |

---

## 6. Idempotência e Limpeza de Dados

Para garantir execução determinística e repetível:
- O módulo auxiliar `src/e2e/setup.mjs` fornece rotinas de limpeza antes e após os cenários de teste;
- Dados criados dinamicamente nos testes utilizam identificadores com prefixo controlado (ex.: `E2E Test Student`, `e2e-temp-*`) para permitir limpeza atômica sem impactar dados de semente;
- As fixtures multi-tenant fixas (`Tenant Alpha` e `Tenant Beta`) em `supabase/seed-multi-tenant.sql` são restauradas pelo script de setup sempre que necessário.

---

## 7. Segregação e Integração Contínua (CI/CD)

- **CI Remoto (GitHub Actions):** Executa `npm run test:unit` (198 testes unitários determinísticos, sem dependência de Docker).
- **Validação Local Pré-PR:** O desenvolvedor ou agente deve rodar obrigatoriamente:
  ```bash
  npm run lint
  npm run build
  npm run test:unit
  npm run test:integration
  npm run validate:rls
  npm run audit:db
  npm run test:e2e
  ```
