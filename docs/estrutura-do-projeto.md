# Estrutura do Projeto — Smart Exit School

## Árvore de diretórios

```
smart-exit-school/
├── .github/
├── ai/
├── docs/
│   └── arquitetura/          # ADRs, modelagem, padrões
├── public/
├── scripts/
│   ├── validate-rls-foundation.mjs
│   └── db-auditor/           # Auditor v1 (contrato até Migration 0005)
├── supabase/
│   ├── config.toml
│   ├── migrations/           # 0001–0005, 0007–0012
│   ├── seed.sql
│   └── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── assets/
    ├── components/
    │   └── StudentCard.jsx   # Legado — não utilizado
    ├── contexts/
    │   ├── platformAdminContext.js
    │   └── PlatformAdminProvider.jsx
    ├── hooks/
    │   └── usePlatformAdmin.js
    ├── lib/
    │   └── supabase.js
    ├── pages/
    │   ├── Login.jsx
    │   ├── InstitutionsManager.jsx
    │   ├── InstitutionPanel.jsx
    │   └── TvDisplay.jsx
    ├── repositories/
    │   ├── schoolRepository.js
    │   └── platformAdminRepository.js
    └── services/
        ├── authService.js
        ├── schoolService.js
        ├── platformAdminService.js
        ├── gateService.js
        ├── callService.js
        ├── themeService.js
        └── core/
            ├── keys.js
            └── storageClient.js
```

## Camadas de dados

```
Page / Provider
      ↓
Service
      ↓
Repository  →  Supabase
      ↓
storageClient → localStorage (quando aplicável)
```

| Módulo | Persistência |
|--------|--------------|
| `schoolService` / `schoolRepository` | Supabase `public.schools` |
| `platformAdminService` / `platformAdminRepository` | RPC `is_platform_admin()` |
| `authService` | Sessão operacional local `@SmartExit:loggedSchool` (sem login; ADR-029) |
| `gateService` | localStorage `@SmartExit:gates:{id}` |
| `callService` | localStorage `@SmartExit:called:{id}` |
| `themeService` | localStorage `@SmartExit:darkMode` |

**Nota:** `Login.jsx` autentica somente Platform Admin (Supabase Auth). Catálogo de instituições: service → repository.

## Migrations (ordem)

| Nº | Arquivo (resumo) |
|----|------------------|
| 0001 | Authentication core (`schools`, `profiles`, `roles`, `school_members`) |
| 0002 | Academic core |
| 0003 | Student group assignments |
| 0004 | Pickup core (`gates`, `pickup_events`) |
| 0005 | RLS foundation |
| 0007 | `platform_admins` + `is_platform_admin()` |
| 0008 | SELECT/UPDATE `schools` para Platform Admin |
| 0009 | Bootstrap Platform Admin |
| 0010 | Trigger `auth.users` → `profiles` |
| 0011 | RLS `platform_admins` |
| 0012 | INSERT/DELETE `schools` para Platform Admin |

## Database Auditor

`npm run audit:db` valida a **fundação até Migration 0005** (contrato do Auditor v1). Migrations 0007–0012 existem no projeto, mas ainda não fazem parte desse contrato de auditoria.

## Arquivos órfãos

| Arquivo | Status |
|---------|--------|
| `src/App.css` | Não importado |
| `src/components/StudentCard.jsx` | Não referenciado |
| `public/sounds/call.mp3` | Não referenciado |
