# Permissões — Smart Exit School

## Domínios (ADR-028)

| Domínio | Quem | Como se identifica hoje |
|---------|------|-------------------------|
| **Platform** | Platform Admin | Supabase Auth + `public.platform_admins` + RPC `is_platform_admin()` |
| **Tenant** | Operador da instituição | Auth Tenant **não implementado** (ADR-029); sessão operacional local se existir |
| **Telão** | Anônimo | Rota `/tv` (lê fila no localStorage da mesma origem) |

Papéis de tenant no banco (`roles`): `owner`, `administrator`, `secretary`, `gatekeeper` — usados por RLS; o painel ainda não autentica via `school_members`.

---

## Matriz: Platform Admin vs Operador

| Funcionalidade | Platform Admin | Operador da instituição |
|----------------|:--------------:|:-----------------------:|
| CRUD instituições (`schools`) | ✅ | ❌ |
| Alterar plano / suspender | ✅ | ❌ |
| Guard `/admin/institutions` | ✅ (`usePlatformAdmin`) | — |
| CRUD alunos / turmas / portões | ❌ | ✅ (quando houver sessão) |
| Monitor / TV | ❌ | ✅ |
| Whitelabel | ❌ | ✅* |
| Reset de fábrica (LS) | ❌ | ✅ |

\* Conforme plano na UI

---

## Planos e restrições

A UI usa rótulos Basic / Premium / Diamond / Trial. No banco (`public.schools.plan`): `basic` / `pro` / `enterprise`. O `schoolService` adapta na escrita.

Restrições de features por plano permanecem **na UI** do painel (não enforced por RLS de produto).

---

## Isolamento multi-tenant

- Catálogo e ciclo de vida de instituições: RLS + `is_platform_admin()` / membership
- Dados operacionais do painel: isolamento por `school.id` em `@SmartExit:gates:*` e `@SmartExit:called:*`

---

## Relacionados

- [autenticacao.md](autenticacao.md)
- [fluxos.md](fluxos.md)
- ADR-028 / ADR-029 em [arquitetura/decisoes.md](arquitetura/decisoes.md)
