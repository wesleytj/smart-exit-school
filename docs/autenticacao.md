# Autenticação — Smart Exit School

A identidade do usuário é a sessão do Supabase Auth (ADR-004). O identificador usado pela aplicação é `auth.uid()`. `public.schools` representa a organização e não guarda credencial (ADR-005). `public.profiles` não carrega `school_id` (ADR-007). A autorização do tenant não é lida de `profiles`.

```text
Supabase Auth
    ↓
auth.uid()
    ↓
school_members.profile_id
    ↓
active membership
    ↓
school_id
    ↓
schools
    ↓
tenant context
    ↓
tenant-aware application
    ↓
RLS
```

Platform Admin não é tenant de escola:

```text
Platform Admin
    ↓
is_platform_admin()
    ↓
/admin/institutions
```

## Usuário de escola

`school_members` é a fonte de autorização do tenant. A membership precisa estar ativa. A escola autorizada é `school_members.school_id` da linha ativa cujo `profile_id` é o `auth.uid()` da sessão, e somente se a RLS também devolver essa escola.

| Situação | Comportamento |
|---|---|
| Sem sessão | `/painel` volta para `/login`. Não há contexto de tenant. |
| Sessão e zero memberships ativas | O usuário não recebe contexto de escola. O painel não abre. A sessão de operador é encerrada. |
| Uma membership ativa | O contexto é resolvido automaticamente e o painel abre. |
| Várias memberships ativas | A seleção é explícita, somente entre memberships autorizadas. Um id fora dessa lista não vira contexto. |

A escolha entre várias escolas fica na memória da interface e é revalidada com nova leitura de membership. Ela não é gravada em `profiles`.

Logout encerra a sessão do Supabase Auth (`supabase.auth.signOut()`).

## Platform Admin

Platform Admin e usuário de escola são domínios separados (ADR-028).

- A autoridade de plataforma é a RPC `is_platform_admin()`, não `school_members`.
- O fluxo de Platform Admin é `/admin/institutions`.
- `is_platform_admin()` não concede o painel de escola.
- Membership ativa não concede privilégio de plataforma.
- Em `/painel`, a autoridade de plataforma é resolvida antes do contexto tenant. Se ela estiver presente, a rota vai para `/admin/institutions` e o painel de escola não é montado, mesmo que existam memberships.

## Estado local

`localStorage` não é autoridade. `@SmartExit:loggedSchool` não autoriza acesso e não escolhe o tenant.

Alunos, turmas, portões e chamadas do painel ainda podem permanecer no browser como cache operacional da escola já autorizada (`@SmartExit:schoolOps:{schoolId}`, `@SmartExit:gates:{schoolId}`, `@SmartExit:called:{schoolId}`). Esse cache não é identidade. Portões e chamadas locais não são `public.gates` nem `public.pickup_events`.

## Segurança

- RLS continua sendo a autoridade no banco.
- A Feature #49 não alterou RLS, policies nem grants.
- Não existe impersonation.
- Não existe bypass de autorização por `localStorage`.
- Não existe provisioning automático de membership.
- Não existe uso de `service_role` para resolver o tenant.

## Estado de validação

Neste ambiente, `school_members = 0`.

O isolamento runtime com dois usuários/JWTs de escolas diferentes ainda não foi certificado dinamicamente neste ambiente porque não existem memberships de escola disponíveis para execução desse cenário.

Isso não equivale a certificação do runtime multi-tenant.

## Feature #49

| Item | Estado |
|---|---|
| Issue | #49 |
| PR | #50, merged |
| `main` | `bfbfdaf50d81ddbc06786b8f3bb10fbc7d8cfc1d` |
| Implementação | concluída em `main` |
| Release | não realizado |

A Feature não cria usuário, profile nem `school_members`.
