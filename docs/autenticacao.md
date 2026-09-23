# Autenticação — Smart Exit School

A identidade do usuário é a sessão do Supabase Auth (ADR-004). O identificador usado pela aplicação é `auth.uid()`. `public.schools` representa a organização e não guarda credencial (ADR-005). `public.profiles` não carrega `school_id` (ADR-007). Esta Feature não lê `profiles` para autorizar o painel.

Não houve alteração de schema, RLS, grants ou funções SQL nesta Feature.

## Usuário de escola

```text
Supabase Auth
    ↓
auth.uid()
    ↓
school_members ativos
    ↓
schools
    ↓
contexto de tenant
    ↓
painel /painel
```

A escola autorizada é `school_members.school_id` da linha ativa cujo `profile_id` é o `auth.uid()` da sessão, desde que a RLS também devolva essa escola. Um `school_id` vindo de URL, estado de tela ou cache local não é prova de autorização.

| Situação | Comportamento |
|---|---|
| Sem sessão | `/painel` volta para `/login`. Não há contexto de tenant. |
| Sessão e zero memberships ativas | Não há contexto. O painel não abre. A sessão de operador é encerrada. |
| Uma membership ativa | A escola correspondente é o contexto e o painel abre. |
| Várias memberships ativas | A pessoa escolhe a escola antes de operar. Só entram escolas presentes na lista autorizada. Um id fora dessa lista não vira contexto. |

A escolha entre várias escolas fica na memória da interface e é revalidada com nova leitura de membership. Ela não é gravada em `profiles`.

## Platform Admin

Platform Admin e usuário de escola são domínios separados (ADR-028).

- A autoridade de plataforma é a RPC `is_platform_admin()`, não `school_members`.
- O login de Platform Admin continua em `/admin/institutions`.
- `is_platform_admin()` não concede o painel de escola.
- Membership ativa não concede privilégio de plataforma.
- Em `/painel`, a autoridade de plataforma é resolvida antes do contexto tenant. Se ela estiver presente, a rota vai para `/admin/institutions` e o painel de escola não é montado, mesmo que existam memberships.
- Impersonation não faz parte desta Feature.

## Estado local

Alunos, turmas, portões e chamadas do painel ainda podem permanecer no browser como cache operacional da escola já autorizada (`@SmartExit:schoolOps:{schoolId}`, `@SmartExit:gates:{schoolId}`, `@SmartExit:called:{schoolId}`).

Esse estado é não confiável. Não é identidade, não é autorização e não escolhe o tenant. Portões e chamadas locais não são `public.gates` nem `public.pickup_events`.

## Limites

- A Feature não cria usuário, profile nem `school_members`. Sem um vínculo ativo já existente, o caminho de uma escola não pode ser exercido neste ambiente.
- Não certifica isolamento entre dois JWTs.
