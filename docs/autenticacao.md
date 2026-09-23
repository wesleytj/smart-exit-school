# Autenticação — Smart Exit School

## Visão geral

A identidade vem do Supabase Auth (ADR-004). A aplicação não grava senha em `schools` (ADR-005).

| Domínio | Autoridade | Destino |
|---|---|---|
| Platform Admin | Sessão Auth + RPC `is_platform_admin()` (ADR-028) | `/admin/institutions` |
| Usuário de escola | Sessão Auth + `school_members` ativo + `schools` (ADR-007, ADR-011) | `/painel` |
| Sem sessão | Nenhuma | `/login` |
| Sessão sem membership ativa | Nenhuma autoridade de tenant | Não entra no painel; a sessão de operador é encerrada |

`@SmartExit:loggedSchool` não é mais sessão nem autorização. O painel não aceita e-mail ou senha de escola.

O contexto de tenant não lê `public.profiles`. O `auth.uid()` da sessão é o `profile_id` consultado em `school_members`.

## Login

Arquivo: `src/pages/Login.jsx`. Rota: `/login`.

1. `supabase.auth.signInWithPassword`.
2. Credencial inválida: mensagem "E-mail ou senha incorretos." Não há segundo fator em `schools`.
3. Se `is_platform_admin()` é verdadeiro, a navegação vai para `/admin/institutions`. Membership não promove ninguém a Platform Admin, e Platform Admin não recebe o painel por esse RPC.
4. Caso contrário, a aplicação lê memberships ativas do usuário da sessão e as escolas que a RLS devolver.
5. Um vínculo ativo: contexto dessa escola e entrada no painel.
6. Vários vínculos ativos: a tela pede a escolha da escola antes do painel. Um `school_id` fora da lista autorizada não vira contexto.
7. Nenhum vínculo ativo: `signOut` e a mensagem "Esta conta não possui vínculo ativo com uma escola."

A escolha entre várias escolas fica na memória da sessão de interface e é revalidada com uma nova leitura de membership. Ela não é coluna em `profiles` e não é chave de autorização em `localStorage`.

## Contexto no painel e no telão

`TenantSessionProvider` acompanha a sessão Auth e republica o contexto. `/painel` só monta o painel com status `ready`. Sem sessão, a rota volta ao login. Platform Admin sem membership que abre `/painel` volta à área de plataforma, sem ser tratado como operador de escola.

`/tv` usa o mesmo contexto. Sem escola autorizada, o telão não lê `@SmartExit:loggedSchool`.

## O que continua em localStorage

Dados operacionais do painel (alunos, turmas, portões e chamadas) continuam no browser, fora do Postgres. O cache `@SmartExit:schoolOps:{schoolId}` guarda só o estado operacional da escola já autorizada. Ele não escolhe o tenant e não contém senha.

Portões e chamadas seguem em `@SmartExit:gates:{schoolId}` e `@SmartExit:called:{schoolId}`. Isso não é `public.gates` nem `public.pickup_events`.

## Limites desta Feature

- Não cria usuário, profile nem `school_members`. Sem um vínculo ativo já existente, o caminho de uma escola não pode ser exercido no ambiente.
- Não altera RLS, grants, funções nem schema.
- Não implementa impersonation.
- Não certifica isolamento entre dois JWTs.
