# Changelog Inicial — Smart Exit School

Baseline documentado na criação da documentação técnica do projeto.

**Data da documentação:** 2025-06-21  
**Versão do projeto:** `0.0.0` (package.json)

---

## Contexto

Este changelog registra o **estado conhecido do sistema** no momento da auditoria documental, não um histórico de commits (histórico git não analisado nesta baseline).

---

## Estado funcional identificado

### Aplicação

- SPA React 19 com Vite 8
- 4 páginas principais: Login, Super Admin, Painel Institucional, Telão
- Roteamento via React Router DOM 7
- Estilização Tailwind CSS 4 com suporte a dark mode

### Persistência

- 100% localStorage
- Chaves prefixadas `@SmartExit:`
- Seed automático de 3 escolas mock (Basic, Premium, Diamond)

### Autenticação

- Super Admin hardcoded
- Escolas autenticadas via registro local
- Sem backend de auth

### Planos SaaS

- Basic, Premium, Diamond, Trial (select only)
- Restrições por plano implementadas na UI
- Funcionalidades premium parcialmente placeholder

---

## Componentes e módulos

| Módulo | Linhas aprox. | Status |
|--------|---------------|--------|
| `InstitutionPanel.jsx` | ~1305 | Ativo — núcleo do sistema |
| `InstitutionsManager.jsx` | ~388 | Ativo |
| `TvDisplay.jsx` | ~206 | Ativo |
| `Login.jsx` | ~109 | Ativo |
| `StudentCard.jsx` | ~70 | Legado — não utilizado |
| `students.js` | ~26 | Legado — não utilizado |

---

## Dependências principais (baseline)

| Pacote | Versão |
|--------|--------|
| react | 19.2.5 |
| react-dom | 19.2.5 |
| react-router-dom | 7.17.0 |
| vite | 8.0.10 |
| tailwindcss | 4.2.4 |
| lucide-react | 1.14.0 |

---

## Documentação criada

Estrutura inicial de documentação técnica:

```
README.md
docs/
├── arquitetura.md
├── estrutura-do-projeto.md
├── tecnologias.md
├── banco-de-dados.md
├── regras-de-negocio.md
├── funcionalidades.md
├── api.md
├── autenticacao.md
├── permissoes.md
├── deploy.md
├── instalacao.md
├── troubleshooting.md
├── roadmap.md
└── changelog-inicial.md
ai/
├── ai-context.md
├── coding-rules.md
├── project-summary.md
└── forbidden-actions.md
```

---

## Known issues (baseline)

Documentados em detalhe nos demais arquivos:

1. Credenciais em texto plano
2. Admin password no source code
3. Rota admin sem proteção
4. Dois modelos de portão (`exits` vs `gatesList`)
5. Status Inativo não bloqueia login
6. Código morto (StudentCard, students.js, App.css)
7. API Key sem consumo
8. i18n sem implementação
9. Sem backend/banco de dados
10. README anterior era template Vite genérico

---

## Próximo changelog

Futuras entradas devem seguir formato:

```markdown
## [versão] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

---

## Pontos que precisam de validação

- Histórico real de commits/git para changelog retroativo
- Numeração de versões futuras (semver)
- Processo de release
