---
description: SES Architecture — padroes da camada DAL, transicao de persistencia e frontend
trigger: always_on
---

# SES 01 — Architecture & Persistence Standards

## 1. Padrao DAL Obrigatorio (Data Access Layer)

- **Proibicao de Acesso Direto:** Componentes React (`src/pages/*`, `src/components/*`) **nunca** devem interagir diretamente com o cliente Supabase (`@supabase/supabase-js`) ou com o `storageClient` (`localStorage`).
- **Encapsulamento nos Services:** Toda leitura, escrita, subscricao ou transformacao de dados deve residir exclusivamente em `src/services/` (ex.: `schoolService.js`, `gateService.js`, `callService.js`, `authService.js`).
- **Tratamento de Erros:** Services devem retornar dados normalizados ou lancar erros descritivos conhecidos pela UI.

## 2. Transicao de Persistencia (Hibrida Local ↔ Supabase)

O Smart Exit School esta em processo de transicao arquitetural gradual:
- **Modulo de Escolas (`public.schools`):** Totalmente integrado ao Supabase PostgreSQL via `schoolService`.
- **Modulo de Portões (`public.gates`):** Totalmente integrado ao Supabase PostgreSQL via `gateService`.
- **Identidade e Membros (`public.school_members`):** Integrado via Supabase Auth e RPCs de controle.
- **Chamadas de Saida e Turmas:** Mantidas temporariamente em `storageClient` com comunicacao cross-tab via eventos de storage.

Qualquer evolucao que migre novas entidades do `localStorage` para o PostgreSQL deve ser tratada como Feature arquitetural e respeitar as migrations versionadas e o Decision Gate `G-DB`.

## 3. Frontend e Convencoes de UI

- **Tailwind CSS 4:** Utilize classes utilitarias padrao sem depender de plugins legados do Tailwind v3. Respeite o suporte a dark mode nativo via classes de tema.
- **Rotas e Protecao:**
  - `/login`: Publica.
  - `/admin/institutions`: Protegida por `is_platform_admin()`.
  - `/painel`: Protegida por membership ativa em `school_members`.
  - `/tv`: Cache operacional local para telao de chamadas.
