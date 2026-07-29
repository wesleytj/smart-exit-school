# Smart Exit School

Sistema web para gestão e monitoramento da saída de alunos em instituições de ensino, desenvolvido pela **AllTech Solutions**.

![Preview Smart Exit School](https://github.com/wesleytj/smart-exit-school/blob/main/docs/screenshots/preview_ses.gif)

## Descrição

O **Smart Exit School** é uma plataforma **SaaS multi-tenant** (SPA React) que digitaliza a fila de chamadas na saída escolar: operadores acionam alunos no painel institucional e monitores/TV exibem a fila em tempo quase real.

## Principais funcionalidades

- **Platform Admin:** gestão de instituições (`public.schools`) autenticada via Supabase Auth + `platform_admins`
- **Multi-tenant:** isolamento por escola (schema + RLS; operação do painel ainda híbrida)
- **Painel institucional:** turmas, alunos, portões e monitor de saída
- **Telão (TV):** fila de chamadas e branding por plano
- **Importação CSV** de alunos
- **Whitelabel** (logo/cores) conforme plano
- **Dark mode**

## Stack

- React 19 + Vite 8 + Tailwind CSS 4 + React Router DOM 7
- Supabase (PostgreSQL, Auth, RLS, RPC) — `@supabase/supabase-js`
- Camadas: **Repository Pattern** + **Service Layer**

## Arquitetura (resumo)

```
Pages
      ↓
Services
      ↓
Repositories
      ↓
Supabase Auth
      ↓
Supabase Database
```

## Estado atual da arquitetura

Atualmente o Smart Exit School utiliza uma arquitetura híbrida.

### Supabase

- Auth
- Schools
- Profiles
- Platform Admin
- RLS
- RPC

### LocalStorage (temporário)

- Sessão escolar
- Gates
- Pickup Calls
- Preferências

Esses módulos serão migrados gradualmente para o Supabase conforme o roadmap do projeto.

| Domínio | Persistência atual |
|---------|-------------------|
| Catálogo de escolas | **Supabase** `public.schools` (única fonte de verdade) |
| Platform Admin | **Supabase Auth** + `profiles` + `platform_admins` + RPC `is_platform_admin()` |
| Sessão / gates / calls / tema | **localStorage** (`@SmartExit:*`) |

Detalhes: [docs/arquitetura.md](docs/arquitetura.md) · [docs/fluxos.md](docs/fluxos.md) · ADRs em [docs/arquitetura/decisoes.md](docs/arquitetura/decisoes.md)

## Como executar localmente

```bash
git clone https://github.com/wesleytj/smart-exit-school.git
cd smart-exit-school
npm install

# Variáveis (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
# Use as chaves do `supabase start`

supabase start
supabase db reset   # migrations até 0012 + seed

npm run dev         # http://localhost:5173
```

**Platform Admin:**

1. Criar usuário no Supabase Auth
2. O trigger criará automaticamente o profile
3. Inserir o usuário em public.platform_admins

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/arquitetura.md](docs/arquitetura.md) | Visão arquitetural atual |
| [docs/fluxos.md](docs/fluxos.md) | Fluxos Auth, Platform Admin e Instituições |
| [docs/autenticacao.md](docs/autenticacao.md) | Auth Platform vs Tenant |
| [docs/banco-de-dados.md](docs/banco-de-dados.md) | Schema, RLS, migrations |
| [docs/estrutura-do-projeto.md](docs/estrutura-do-projeto.md) | Pastas e módulos |
| [docs/instalacao.md](docs/instalacao.md) | Setup local |
| [docs/permissoes.md](docs/permissoes.md) | Platform / Tenant / planos |

## Status atual

| Área | Status |
|------|--------|
| Frontend SPA + Service/Repository | ✅ |
| Schema PostgreSQL (0001–0005, 0007–0012) | ✅ |
| Catálogo `schools` no Supabase (CRUD Platform Admin) | ✅ |
| Platform Admin Auth + RPC + guard | ✅ |
| RLS foundation + policies Platform em `schools` | ✅ |
| Operações do painel institucional | ⚠️ Persistência temporária em localStorage (migração futura para Supabase)
| Login operador da instituição (Auth Tenant) | 🚧 ADR-029 — não implementado |
| Produção 1.0 | 🚧 |

## Sobre a AllTech Solutions

A **AllTech Solutions** desenvolve soluções tecnológicas para educação e logística escolar.

**Autor:** Wesley Treib Jacques
