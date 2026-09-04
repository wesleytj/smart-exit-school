# Changelog

Todas as mudanças relevantes do AADS devem ser registradas neste documento.

O objetivo é manter a evolução do padrão documentada e auditável.

---

## Versionamento

O AADS utiliza Versionamento Semântico (SemVer).

Formato:

MAJOR.MINOR.PATCH

Exemplo:

1.0.0

---

## Regras

### MAJOR

Mudanças incompatíveis.

Exemplos:

- alteração do fluxo principal
- remoção de documentos
- mudanças arquiteturais

---

### MINOR

Novas funcionalidades compatíveis.

Exemplos:

- novos workflows
- novos templates
- novos padrões

---

### PATCH

Correções.

Exemplos:

- ajustes de documentação
- melhorias de texto
- correções de templates

---

# Histórico

## [0.4.0] - 2026-08-05

### Added

AI Runtime & Execution Engine — AADS como framework de execução.

Incluídos:

- `engine/execution-engine.md`
- `engine/decision-engine.md`
- `engine/context-loading.md`
- `engine/developer-protection.md` (Zero Trust Developer)
- `engine/validation-engine.md`
- `engine/delivery-engine.md`
- `standards/compliance-levels.md`
- `standards/llm-adapters.md`
- `adr/adr-003.md` (AI Runtime Layer)

### Changed

- INDEX / README / Source of Truth Map — camada Runtime + LLM Adapters
- Operating Model permanece canônico; Runtime apenas orquestra

### Status

AI Execution Framework (pré-1.0). Cursor Rules ainda ACTIVE FOR VALIDATION.

---

## [0.3.0] - 2026-08-05

### Added

Primeira versão operacional completa do AADS (pré-1.0).

Incluídos:

- `INDEX.md`, `DOCUMENT-STANDARD.md`, `adr/adr-002.md`
- Workflows: bugfix, hotfix, research-spike, refactor, release, maintenance, recovery
- Standards: versioning, testing, naming, project-structure, architecture-definition, prompt-management, risk-management, quality-gates, artifact-lifecycles
- Engine: `ai-recovery-protocol.md`
- Checklists: release, hotfix, ai-compliance
- Templates: research, plan
- `reports/` para auditorias históricas (não-normativas)

### Changed

- README / Project Bootstrap / Work Item Classification alinhados ao mapa de workflows
- Source of Truth Map: responsabilidades estendidas (hierarquia preservada)

### Status

Operacional para projetos reais e multi-IA. Cursor Rules permanecem ACTIVE FOR VALIDATION (não stable).

---

## [0.2.2] - 2026-07-29

### Changed

Ativação das Cursor Rules para validação prática.

Incluídos:

- status interno **ACTIVE FOR VALIDATION** nas 4 rules;
- frontmatter/globs revisados;
- referências canônicas Constitution / Source of Truth / Operating Model em todas as rules;
- `tests/cursor-rules-execution-checklist.md`.

### Status

Rules ativas para validação comportamental no Cursor. Ainda **não** stable.

---

## [0.2.1] - 2026-07-29

### Changed

Validação e otimização das Cursor Rules (draft → pré-stable).

Incluídos:

- `aads-validation` e `aads-git-delivery` com aplicação contextual;
- `ai/aads/tests/cursor-rules-validation.md` (cenários 1–4);
- revisão anti-duplicação / anti-stack-commands.

### Status

Rules otimizadas para menor ruído. Validação prática dos cenários ainda pendente antes de marcar stable.

---

## [0.2.0] - 2026-07-29

### Added

Extração inicial de Cursor Rules (draft operacional).

Incluídos:

- `.cursor/rules/aads-core.mdc`
- `.cursor/rules/aads-workflow.mdc`
- `.cursor/rules/aads-validation.mdc`
- `.cursor/rules/aads-git-delivery.mdc`

### Status

Draft de rules derivado do Engine/Constitution. Sem automação Git e sem novos conceitos AADS.

---

## [0.1.5] - 2026-07-29

### Changed

Limpeza semântica final antes da extração de Cursor Rules.

Incluídos:

- Feature Checklist alinhado ao Completion Model;
- Git Workflow separado de Implementation Completion;
- últimos conflitos semânticos operacionais removidos em standards consumidores.

### Status

Pronto para considerar extração de Cursor Rules a partir do Engine. Rules ainda não publicadas.

---

## [0.1.4] - 2026-07-29

### Changed

Alinhamento semântico ao Operating Model (Semantic Alignment).

Incluídos:

- AI Operating Rules com Completion Model;
- Automatic Checks separados em Quality Validation vs Git Delivery;
- Feature Workflow, Development Workflow e Task Lifecycle com linguagem Implementation / Delivery Complete;
- Task Lifecycle mapeado aos STATES do Operating Model.

### Status

Semântica de conclusão alinhada nos principais standards/workflows. Sem Cursor Rules.

---

## [0.1.3] - 2026-07-29

### Changed

Alinhamento dos consumidores ao Engine (Fase Consumer Alignment).

Incluídos:

- prompts apontando para Source of Truth Map e Operating Model;
- Definition of Done com Implementation vs Delivery Complete;
- Git Checklist separando readiness de entrega;
- deprecação operacional de `engine/ai-execution-protocol.md`.

### Status

Consumidores alinhados ao modelo operacional 0.1.2. Sem Cursor Rules.

---

## [0.1.2] - 2026-07-29

### Added

Camada de governança operacional (Operational Source of Truth).

Incluídos:

- `engine/source-of-truth-map.md` — hierarquia de autoridade;
- `engine/aads-operating-model.md` — máquina de estados de execução;
- Completion Model (`Implementation Complete` / `Delivery Complete` / `Release Complete`);
- Human Approval Gates.

### Status

Fonte operacional canônica criada. Documentos consumidores ainda não estavam alinhados (corrigido em 0.1.3).

---

## [0.1.1] - 2026-07-29

### Fixed

Correção de inconsistências documentais (Fase 1).

Incluídos:

- alinhamento de versionamento para 0.1.1;
- renomeação de `ai-responsibilities.md`;
- correção de paths `ai/aads/` e `ai/`;
- padronização de `Closes #`;
- atualização da estrutura no README;
- alinhamento do template ADR ao ADR Management.

### Status

Versão de consistência documental. Sem mudança de arquitetura operacional.

---

## [0.1.0] - 2026-07-29

### Added

Criação inicial do AADS.

Incluídos:

- README
- Constitution
- ADR-001
- Development Workflow
- Git Workflow
- Branch Strategy
- Task Lifecycle
- Code Review
- Documentation Standard
- Work Item Classification
- Feature Workflow
- Feature Checklist
- Git Checklist
- Definition of Done
- AI Operating Rules
- AI Responsibilities
- Prompt Bootstrap
- Templates
- Engine
- Changelog

### Status

Primeira versão funcional do padrão.

Implementado inicialmente dentro do projeto Smart Exit School.

---

# Próxima versão

## 0.2.0

Planejado:

- Integração automática com Cursor
- Engine expandida
- Protocolos de recuperação
- Workflow de Release
- Workflow de Hotfix
- Workflow de Research
- Workflow de Refactor
- Sistema de Compliance
- Auditoria automática

---

## Roadmap

0.1.x

Estruturação do padrão

↓

0.2.x

Automação

↓

0.3.x

Integração entre projetos

↓

1.0.0

Primeira versão estável