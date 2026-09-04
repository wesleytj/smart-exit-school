# Research / Spike Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Investigar alternativas ou prototipar sem comprometer código de produção.

## Scope

- **Research:** análise/comparação; entrega = documento de decisão.
- **Spike:** experimento; código descartável ou isolado.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Investigar, documentar opções, recomendar |
| Humano | Aceitar recomendação / autorizar Feature seguinte |

## Rules

1. Classificar corretamente (Research vs Spike).
2. Research **nunca** gera código definitivo de produção.
3. Spike pode gerar código descartável; nunca mergear como Feature sem reclassificar.
4. Resultado mínimo:
   - problema
   - alternativas
   - critérios
   - recomendação
   - riscos
5. Se a decisão for arquitetural permanente → propor ADR (`standards/adr-management.md`).
6. Próximo passo típico: abrir Feature/Refactor Issue separada.
7. Completion: Implementation Complete = artefato de research/spike entregue; Delivery = PR de docs quando aplicável; sem Release de produto.

## Related Documents

- `templates/research-template.md`
- `standards/work-item-classification.md`
- `standards/adr-management.md`
- `engine/aads-operating-model.md`
