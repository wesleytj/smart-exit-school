# Fluxos — Smart Exit School

Documentação dos fluxos reais do sistema (estado atual do código).

---

## Platform Admin

```
Supabase Auth (signInWithPassword)
        ↓
auth.users
        ↓
Trigger on_auth_user_created
        ↓
public.handle_new_user()
        ↓
public.profiles
        ↓
public.platform_admins  (bootstrap / provisionamento)
        ↓
RPC public.is_platform_admin()
        ↓
platformAdminRepository → platformAdminService
        ↓
PlatformAdminProvider → usePlatformAdmin()
        ↓
InstitutionsManager (guard) / Login (redirect admin)
```

Se o login Auth for válido mas `is_platform_admin()` retornar `false`, o frontend executa `signOut()` e exibe erro de permissão.

---

## Instituições (catálogo)

```
InstitutionsManager
        ↓
schoolService
        ↓
schoolRepository
        ↓
Supabase PostgREST
        ↓
public.schools
```

| Operação | Método repository | RLS |
|----------|-------------------|-----|
| Listar | `getAll()` | SELECT (membro ativo **ou** Platform Admin) |
| Criar | `create()` | INSERT (somente Platform Admin) |
| Atualizar | `update()` | UPDATE (Platform Admin **ou** owner/administrator do tenant) |
| Excluir | `delete()` | DELETE (somente Platform Admin) |

**Fonte de verdade do catálogo:** exclusivamente `public.schools` (Supabase).

---

## Autenticação (Login)

```
Login.jsx
        │
        └─► supabase.auth.signInWithPassword()
                  │
                  ├─ is_platform_admin() === true  →  /admin/institutions
                  └─ Auth OK, mas não Platform Admin → signOut() + erro
```

### Auth Tenant (operadores da instituição)

**Não implementado** (ADR-029). Não existe login por email/senha em `schools` (ADR-005).

A sessão operacional do painel/TV, quando presente, usa apenas `@SmartExit:loggedSchool` via `authService` (storage), sem fluxo de autenticação ativo no Login.

---

## Painel institucional ↔ TV

```
InstitutionPanel (callService.addCall)
        ↓
localStorage @SmartExit:called:{schoolId}
        ↓
TvDisplay (storage event + polling 2s)
```

Portões: `gateService` → `@SmartExit:gates:{schoolId}`.
