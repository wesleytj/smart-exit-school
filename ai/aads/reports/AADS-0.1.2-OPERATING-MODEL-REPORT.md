# AADS 0.1.2 Operating Model Report

## Arquivos criados

| Arquivo | Função |
|---|---|
| `engine/source-of-truth-map.md` | Hierarquia de autoridade e resolução de conflitos |
| `engine/aads-operating-model.md` | Máquina de estados operacional da IA |
| `AADS-0.1.2-OPERATING-MODEL-REPORT.md` | Relatório desta fase |

**Arquivos existentes alterados:** nenhum.  
**Workflows/templates/standards alterados:** nenhum.  
**Cursor Rules criadas:** nenhuma.

---

## Decisões tomadas

### 1. Hierarquia estendida além do exemplo inicial

O exemplo da fase sugeria:

Constitution → Engine → Standards → Workflows → Checklists → Templates

A hierarquia oficial adotada inclui também:

- **AADS ADRs** imediatamente abaixo da Constitution (já previsto em `prompts/bootstrap.md` e Constitution Art. 16).
- **Prompts** como camada de menor autoridade (empacotamento, não fonte de regras).

Motivo: sem ADRs, decisões estruturais do AADS ficariam sem lugar na hierarquia. Sem Prompts, conflitos prompt↔engine permaneceriam implícitos.

### 2. Engine acima de Standards para interpretação operacional

O Engine **não cria** regras de produto nem cancela a Constitution.

Ele prevalece sobre Standards/Workflows/Checklists apenas quando há:

- sobreposição de fluxos;
- ambiguidade de termos (“concluído”, “pronto”);
- necessidade de sequenciar estados.

### 3. Context Loading mínimo

Foi introduzido o conceito de carga mínima por tipo de trabalho, para corrigir a exigência prática (e inviável) de “ler todo o AADS” a cada pedido — sem alterar os prompts existentes nesta fase.

### 4. Completion Model em três estados

Para resolver a ambiguidade Merge = conclusão absoluta, sem modificar Git Workflow / DoD:

- `Implementation Complete`
- `Delivery Complete`
- `Release Complete`

A Constitution e o DoD continuam válidos; o modelo exige declaração honesta do subestado quando Delivery depende de permissão humana.

### 5. Human Approval Gates explícitos

Separação: IA prepara / humano decide, com gates para arquitetura, segurança, banco, remoções, irreversíveis, ADR, merge restrito e Hotfix.

### 6. Duplicações existentes não foram fundidas

Sobreposições (`development-workflow`, `task-lifecycle`, `feature-workflow`, `ai-execution-protocol`, `bootstrap`) permanecem. O mapa as subordina por regra de interpretação até uma fase futura de consolidação.

---

## Hierarquia definida

```text
Level 1 — Constitution
Level 2 — AADS ADRs
Level 3 — Engine
Level 4 — Standards
Level 5 — Workflows
Level 6 — Checklists
Level 7 — Templates
Level 8 — Prompts
```

Camadas externas (abaixo do processo AADS para questões de processo):

- contexto do projeto (`ai/`)
- docs/ADRs do projeto
- solicitação do usuário (não pode violar Constitution)

---

## Estados operacionais criados

| Estado | Nome |
|---|---|
| STATE 01 | REQUEST RECEIVED |
| STATE 02 | WORK CLASSIFICATION |
| STATE 03 | CONTEXT ANALYSIS |
| STATE 04 | PLANNING |
| STATE 05 | IMPLEMENTATION |
| STATE 06 | VALIDATION |
| STATE 07 | HUMAN APPROVAL |
| STATE 08 | COMPLETION |

Completion subtypes:

| Estado | Responsável |
|---|---|
| Implementation Complete | IA |
| Delivery Complete | Humano/IA conforme permissão |
| Release Complete | Equipe/projeto |

---

## Possíveis conflitos futuros

| Conflito | Por que pode surgir | Mitigação sugerida (fase futura) |
|---|---|---|
| Prompt bootstrap ainda lista ordem sem Engine | Prompt não foi alterado em 0.1.2 | Atualizar bootstrap para apontar Engine + este mapa |
| `ai-execution-protocol.md` vs Operating Model | Dois textos de sequência no Engine | Tornar protocol um ponteiro curto na consolidação |
| DoD / Git Checklist exigem Merge para “done” | Textos antigos vs Completion Model | Alinhar redação dos checklists na próxima fase |
| Feature Workflow vs Task Lifecycle vs Development Workflow | Três ciclos narrativos | Eleger canônicos e converter o resto em referências |
| Hotfix “ignora ciclo” sem workflow | Classification permite atalho vago | Criar `workflows/hotfix-workflow.md` |
| CHANGELOG ainda não registra 0.1.2 | Restrição de não alterar arquivos existentes | Atualizar CHANGELOG/README na próxima fase de release documental |

Nenhum conflito criado nesta fase viola a Constitution: o Operating Model declara explicitamente o teto constitucional e proíbe pular princípios permanentes.

---

## Próxima fase recomendada

**0.1.3 / consolidação leve (ainda sem Cursor Rules):**

1. Atualizar `prompts/bootstrap.md` e `prompts/system-prompt.md` para apontar Engine + Source of Truth Map (sem fundir docs).
2. Registrar `0.1.2` no CHANGELOG e README.
3. Alinhar redação de “concluído” em DoD/Git Checklist ao Completion Model.
4. Em seguida: workflows ausentes (Release/Hotfix) e só depois extrair Cursor Rules a partir de `aads-operating-model.md`.
