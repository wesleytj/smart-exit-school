# Task Lifecycle

> Este documento define o ciclo de vida de qualquer tarefa executada sob o padrão AADS.

Nenhuma tarefa deve ignorar este fluxo.

**Sequência operacional oficial:** `engine/aads-operating-model.md`  
As fases abaixo são o ciclo de vida descritivo. Quando houver sobreposição ou ambiguidade de ordem com o Operating Model, **o Operating Model prevalece**.

---

# Objetivo

Toda tarefa possui um início, um desenvolvimento e um encerramento.

O AADS padroniza esse ciclo para garantir previsibilidade, rastreabilidade e qualidade.

A IA nunca deve iniciar implementações diretamente.

Ela deve seguir as fases descritas aqui, interpretadas pelos estados do Operating Model.

---

# Mapeamento para o Operating Model

| Fase deste documento | Estado oficial (Operating Model) |
|---|---|
| Fase 1 — Entendimento | STATE 01 — REQUEST RECEIVED |
| Fase 2 — Descoberta | STATE 02–03 — CLASSIFICATION + CONTEXT ANALYSIS |
| Fase 3 — Planejamento | STATE 04 — PLANNING |
| Fase 4 — Implementação | STATE 05 — IMPLEMENTATION |
| Fase 5 — Validação | STATE 06 — VALIDATION |
| Fase 6 — Revisão | STATE 06 / preparação para STATE 07 |
| Fase 7 — Git | Delivery path → Delivery Complete |
| Fase 8 — Encerramento | STATE 08 — COMPLETION |

Human Approval Gates: STATE 07 do Operating Model (quando aplicável).

---

# Fase 1 — Entendimento

Antes de qualquer implementação, a IA deve compreender completamente a solicitação.

Obrigatoriamente deve identificar:

- objetivo
- contexto
- escopo
- limitações
- impacto esperado

Caso existam ambiguidades, deve interromper o fluxo e solicitar esclarecimentos.

Nunca assumir requisitos.

---

# Fase 2 — Descoberta

A IA deve localizar tudo que possui relação com a tarefa.

Isso inclui:

- arquivos
- componentes
- services
- repositories
- hooks
- providers
- contextos
- documentação
- ADRs
- regras de negócio
- workflows

Nenhuma implementação deve começar sem essa etapa.  
Carregar contexto **mínimo necessário** conforme o Operating Model (STATE 03).

---

# Fase 3 — Planejamento

Antes de escrever código, a IA deve construir um plano.

O plano deve responder:

- O que será alterado?
- Quais arquivos?
- Qual impacto?
- Existe risco?
- Existe reutilização possível?
- Existe dívida técnica relacionada?

Somente após existir um plano claro a implementação pode iniciar.

---

# Fase 4 — Implementação

A implementação deve:

- respeitar a arquitetura existente;
- modificar apenas o necessário;
- evitar duplicações;
- preservar compatibilidade;
- manter o projeto compilando.

Durante esta fase a IA nunca deve declarar Implementation Complete nem Delivery Complete.

---

# Fase 5 — Validação

Após implementar, validar:

- lint
- build
- consistência
- documentação
- arquitetura
- checklist
- Definition of Done (critérios de Implementation Complete)

Qualquer erro retorna a tarefa para a fase de Implementação.

---

# Fase 6 — Revisão

A IA deve revisar criticamente sua própria implementação.

Perguntas obrigatórias:

- Existe código duplicado?
- Existe código morto?
- Existe simplificação possível?
- Existe risco de regressão?
- Existe quebra arquitetural?
- Existe documentação desatualizada?

Caso exista qualquer problema, corrigir antes de prosseguir.

---

# Fase 7 — Git

Somente após as validações técnicas:

- preparar commits;
- validar branch;
- validar Issue;
- validar documentação;
- preparar Pull Request.

Seguir obrigatoriamente:

`standards/git-workflow.md`

Esta fase alimenta **Delivery Complete**, não redefine Implementation Complete.

---

# Fase 8 — Encerramento

Usar o Completion Model (`engine/aads-operating-model.md`):

**Implementation Complete** quando:

- gates técnicos / checklists de implementação aprovados;
- o projeto estiver compilando no alcance validável;
- a documentação aplicável estiver atualizada.

**Delivery Complete** quando, além disso:

- Git Checklist de entrega concluído conforme permissões.

Caso contrário, permanecer em andamento no estado correspondente e listar pendências.

Não declarar apenas “tarefa concluída” sem o subestado.

---

# Fluxo Oficial

Nova Tarefa

↓

Entendimento

↓

Descoberta

↓

Planejamento

↓

Implementação

↓

Validação

↓

Revisão

↓

Git

↓

Encerramento (Implementation / Delivery Complete)

↓

Próxima tarefa

---

# Regra Permanente

A IA nunca deve pular etapas.

Se qualquer fase falhar, o fluxo retorna automaticamente para a etapa anterior necessária.

O desenvolvedor não precisa lembrar este fluxo.

A responsabilidade pertence integralmente à IA.

Em conflito de sequência com o Operating Model, seguir o Operating Model.
