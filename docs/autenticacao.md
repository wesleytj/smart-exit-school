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

Alunos, turmas e chamadas do painel ainda podem permanecer no browser (`@SmartExit:schoolOps:{schoolId}`, `@SmartExit:called:{schoolId}`). Portões persistidos estão em `public.gates`. `@SmartExit:gates:{schoolId}` não é fonte de verdade. Esse cache não é identidade. Chamadas locais não são `public.pickup_events`.

## Segurança

- RLS continua sendo a autoridade no banco.
- A Feature #49 não alterou RLS, policies nem grants.
- Não existe impersonation.
- Não existe bypass de autorização por `localStorage`.
- Não existe provisioning automático de membership.
- Não existe uso de `service_role` para resolver o tenant.

## Homologação de produção

O frontend está publicado em `https://smart-exit-school.vercel.app` (Vercel). O banco de produção é o projeto Supabase `yantfnekslrzhussewdh`. As migrations de `main` já foram aplicadas nesse projeto. O arquivo `supabase/seed.sql` completo **não** foi executado em produção.

- Um Platform Admin real autenticou e a aplicação o direcionou para `/admin/institutions`.
- A primeira instituição de homologação é o Colégio Adventista de Esteio, plano `basic`, status `active`.
- As quatro roles (`owner`, `administrator`, `secretary`, `gatekeeper`) foram inseridas isoladamente, porque `school_members.role_id` exige o catálogo. A massa de desenvolvimento do seed (escola, alunos, turmas, portões) não foi para produção.
- Existe um usuário escolar de homologação. É conta de teste, não conta institucional definitiva. O `profile` nasceu do trigger `on_auth_user_created`. A membership ativa, com role `owner`, foi inserida por SQL privilegiado.
- Não existe interface administrativa para criar usuário escolar nem para gravar `school_members`. Esse provisionamento continua sendo operação manual e privilegiada.
- O login dessa conta de teste resolveu o tenant Colégio Adventista de Esteio e abriu `/painel`. O logout encerrou a sessão.
- A resolução de tenant foi validada para uma identidade escolar. O roteamento do Platform Admin também foi validado. Isso não certifica isolamento multi-tenant: ainda não houve teste com duas escolas reais e dois usuários escolares distintos. RLS continua sendo a autoridade final.
- Antes da comercialização em escala, o produto ainda precisa de um fluxo formal de convite ou provisionamento de usuários escolares.

### Rotas observadas na homologação

Um `404 NOT_FOUND` servido pelo Vercel não distingue rota inexistente, fallback de SPA ausente ou bloqueio da aplicação. Não é evidência de RLS nem de autorização.

| Acesso | Resultado observado |
|---|---|
| Usuário escolar em `/admin/institutions` | Vercel `404 NOT_FOUND` |
| Usuário escolar em `/painel` após o fluxo de login, com sessão possivelmente perdida | Vercel `404 NOT_FOUND`; não usar como evidência de autorização |
| Platform Admin em `/admin/institutions` | Acesso confirmado |
| Platform Admin em `/painel` | Vercel `404 NOT_FOUND` |

O login em si direcionou o usuário escolar para `/painel` e o Platform Admin para `/admin/institutions`.

## Feature #49

| Item | Estado |
|---|---|
| Issue | #49 |
| PR | #50, merged |
| `main` | `bfbfdaf50d81ddbc06786b8f3bb10fbc7d8cfc1d` |
| Implementação | concluída em `main` |
| Publicação | frontend na Vercel; migrations aplicadas no Supabase de produção |

A Feature não cria usuário, profile nem `school_members`. O `profile` de um novo usuário Auth nasce do trigger. A membership não nasce da aplicação.
