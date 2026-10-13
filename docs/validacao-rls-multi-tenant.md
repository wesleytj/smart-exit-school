# Estratégia de Validação RLS Multi-Tenant em Runtime

**Ciclo:** D — Estabilização, Testes e Segurança  
**Tarefa:** D-07 — Fixtures e Testes RLS Multi-Tenant em Runtime  
**Status:** Implementado e Certificado  
**Data:** 13/10/2026  

---

## 1. Visão Geral

Este documento descreve a arquitetura de validação em runtime do isolamento multi-tenant por Row Level Security (RLS) no PostgreSQL do Smart Exit School.

Historicamente, o script `npm run validate:rls` operava em modo de validação parcial devido à presença de apenas uma instituição no seed baseline (`smart-exit-dev-school`) e à ausência de usuários de teste com memberships ativas em tenants distintos. Além disso, havia uma divergência entre as policies declaradas e os privilégios efetivos de escrita concedidos ao role `authenticated` nas tabelas `students`, `student_enrollments` e `student_group_assignments`.

Com as entregas da Tarefa D-07:
1. A divergência de grants foi resolvida via migration `20261013150000_align_student_grants_for_authenticated.sql`.
2. Fixtures controladas multi-tenant foram criadas em `supabase/seed-multi-tenant.sql`.
3. Uma suíte de testes de integração em runtime (`src/services/multiTenantIsolationRuntime.test.js`) foi implementada cobrindo 5 cenários no PostgreSQL real.
4. O script oficial `scripts/validate-rls-foundation.mjs` foi atualizado para executar validação completa sem avisos de "validação parcial".

---

## 2. Resolução da Divergência de Grants em Alunos

### Diagnóstico Factual
A análise estática e dinâmica da Data Access Layer (DAL) confirmou que:
- `src/repositories/studentRepository.js` executa operações PostgREST diretas: `.insert()`, `.update()`, `.delete()`.
- `src/repositories/studentEnrollmentRepository.js` e `src/repositories/studentGroupAssignmentRepository.js` também executam PostgREST direto.
- Não existem RPCs `SECURITY DEFINER` intermediando a escrita de alunos no fluxo normal.
- As policies de RLS (`students_insert_member`, `students_update_member`, `students_delete_member`) já existiam com checagens de `is_active_school_member(school_id)`.

### Ação Executada
Foi criada a migration `20261013150000_align_student_grants_for_authenticated.sql`:
```sql
grant insert, update, delete on table public.students to authenticated;
grant insert, update, delete on table public.student_enrollments to authenticated;
grant insert, update, delete on table public.student_group_assignments to authenticated;
```
Com isso, as policies deixaram de estar inoperantes e passaram a proteger e governar ativamente as operações de mutação via PostgREST.

---

## 3. Fixtures Multi-Tenant (`supabase/seed-multi-tenant.sql`)

Para permitir testes determinísticos e validações completas sem alterar a baseline de desenvolvimento (`smart-exit-dev-school`), foram estruturados dois tenants com isolamento mútuo:

### Tenant Alpha
- **Escola:** `Tenant Alpha School` (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, slug `tenant-alpha-school`)
- **Usuário Auth:** `alpha-user@smart-exit.local` (`11111111-1111-1111-1111-111111111111`)
- **Perfil & Vínculo:** `Operador Tenant Alpha`, membership com role `administrator`
- **Ano Letivo:** 2026 ativo (`aaaaaaaa-1000-0000-0000-aaaaaaaaaaaa`)
- **Nível Acadêmico:** Ensino Fundamental Alpha (`aaaaaaaa-2000-0000-0000-aaaaaaaaaaaa`)
- **Turma:** Turma Alpha 1 (`aaaaaaaa-3000-0000-0000-aaaaaaaaaaaa`)
- **Portão:** Portão Alpha (`aaaaaaaa-0003-0000-0000-aaaaaaaaaaaa`)
- **Aluno & Matrícula:** `Aluno Alpha` (`ALPHA-001`, `aaaaaaaa-5000-0000-0000-aaaaaaaaaaaa`), matrícula 2026
- **Enturmação:** Ativa na Turma Alpha 1
- **Evento de Saída:** Chamada ativa (`aaaaaaaa-8000-0000-0000-aaaaaaaaaaaa`)

### Tenant Beta
- **Escola:** `Tenant Beta School` (`bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`, slug `tenant-beta-school`)
- **Usuário Auth:** `beta-user@smart-exit.local` (`22222222-2222-2222-2222-222222222222`)
- **Perfil & Vínculo:** `Operador Tenant Beta`, membership com role `administrator`
- **Ano Letivo:** 2026 ativo (`bbbbbbbb-1000-0000-0000-bbbbbbbbbbbb`)
- **Nível Acadêmico:** Ensino Fundamental Beta (`bbbbbbbb-2000-0000-0000-bbbbbbbbbbbb`)
- **Turma:** Turma Beta 1 (`bbbbbbbb-3000-0000-0000-bbbbbbbbbbbb`)
- **Portão:** Portão Beta (`bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb`)
- **Aluno & Matrícula:** `Aluno Beta` (`BETA-001`, `bbbbbbbb-5000-0000-0000-bbbbbbbbbbbb`), matrícula 2026
- **Enturmação:** Ativa na Turma Beta 1
- **Evento de Saída:** Chamada ativa (`bbbbbbbb-8000-0000-0000-bbbbbbbbbbbb`)

---

## 4. Matriz de Cenários RLS Testados em Runtime

Os testes foram implementados em `src/services/multiTenantIsolationRuntime.test.js` e validados diretamente contra o PostgreSQL local via PostgREST:

| Cenário | Descrição | Ação Técnica | Resultado Esperado | Evidência Comprovada |
|---|---|---|---|---|
| **Cenário 1** | Acesso Autorizado Intra-Tenant | Usuário Alpha consulta e insere registros no Tenant Alpha | HTTP 200 OK, dados retornados e persistidos | `ok 1`, `ok 2`, `ok 3` (PASS) |
| **Cenário 2** | Vazamento Cruzado - Leitura | Usuário Alpha tenta consultar escolas, alunos, portões ou chamadas do Tenant Beta | 0 linhas retornadas (`data: []`) | `ok 1`, `ok 2`, `ok 3`, `ok 4` (PASS) |
| **Cenário 3** | Vazamento Cruzado - Escrita | Usuário Alpha tenta inserir aluno ou portão com `school_id` do Tenant Beta | Erro PostgreSQL `42501` (RLS policy violation) | `code: '42501'`, `new row violates row-level security policy` (PASS) |
| **Cenário 4** | Impersonation Cross-Tenant Isolation | Token JWT com claims de impersonation em nome do Usuário Alpha tenta ler dados de Beta | 0 linhas retornadas de Beta; dados de Alpha acessíveis | `ok 1` (PASS) |
| **Cenário 5** | Proteção de Privilégios de Plataforma | Usuário de tenant tenta invocar RPC restrita `list_platform_users` ou ler `platform_admins` | Erro `42501` na RPC; 0 linhas na tabela | `code: '42501'`, `Access denied: caller is not a platform admin` (PASS) |

---

## 5. Comandos de Validação e Execução

Para reproduzir ou auditar o isolamento multi-tenant:

```bash
# 1. Validação RLS completa da fundação (sem avisos de validação parcial)
npm run validate:rls

# 2. Execução da suíte de testes de integração RLS em runtime
npm run test:integration

# 3. Auditoria estrutural do banco de dados (schema, RLS e seed invariants)
npm run audit:db
```
