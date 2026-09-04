# AADS Compliance Levels

**Version:** 0.4.0  
**Status:** Active  
**Layer:** standards

## Objective

Definir níveis de conformidade AADS adotáveis por tamanho/risco de projeto.

## Scope

Política de adoção. Não altera Constitution (sempre Level-ceiling).

## Responsibilities

| Role | Duty |
|---|---|
| Projeto | Declarar nível alvo no `ai/ai-context.md` ou README |
| IA | Operar no nível declarado; nunca abaixo da Constitution |

## Rules

| Level | Name | Criteria |
|---|---|---|
| **L1** | Bootstrap | Constitution + Operating Model + Classification + Git básico; Cursor Rules ou prompts |
| **L2** | Documented | L1 + Documentation Standard + DoD + Issue/PR linkage |
| **L3** | Architected | L2 + ADR Management ativo + Architecture Definition + Human Gates |
| **L4** | Validated | L3 + Testing Standard obrigatório + Validation/Delivery Engines + Quality Gates |
| **L5** | Audited | L4 + AI Compliance Checklist por ciclo + Recovery Protocol + Release Workflow formal |

### Defaults

- Novos projetos AllTech: **mínimo L3**.
- Produção com auth/DB: **L4**.
- Plataformas multi-tenant / críticos: **L5**.

### Runtime

Mesmo em L1–L2, Zero Trust Developer e Completion Model permanecem.

## Related Documents

- `checklists/ai-compliance-checklist.md`
- `engine/developer-protection.md`
- `engine/execution-engine.md`
- `constitution/constitution.md`
- `INDEX.md`
