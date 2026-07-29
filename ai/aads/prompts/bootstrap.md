# AADS Bootstrap Prompt

> Empacotamento de sessão para agentes. **Não é fonte de regras.**  
> Autoridade e execução: Engine AADS.

---

# Objetivo

Antes de implementar, analisar ou sugerir alterações, a IA deve compreender o ambiente e seguir o modelo operacional do AADS.

A IA nunca deve iniciar alterações diretamente sem classificação e contexto mínimo.

---

# Fontes canônicas (obrigatório)

Consultar nesta ordem de uso:

1. **Autoridade / conflitos**  
   `engine/source-of-truth-map.md`

2. **Execução (máquina de estados)**  
   `engine/aads-operating-model.md`

3. **Constituição** (limites permanentes)  
   `constitution/`

4. **Demais camadas** conforme o mapa e a classificação do trabalho  
   (ADRs, Standards, Workflows, Checklists, Templates)

Este prompt **não define regras**. Em caso de conflito entre este texto e o Engine, o Engine prevalece.

---

# Procedimento obrigatório

Seguir os estados de `engine/aads-operating-model.md`.

Resumo de entrada (sem substituir o Operating Model):

## 1. Solicitação e classificação

- Compreender o objetivo.
- Classificar o work item (`standards/work-item-classification.md`).
- Perguntar se houver ambiguidade.

## 2. Context Loading mínimo

Carregar **apenas o contexto necessário** à classificação.

Não exigir leitura completa de `ai/aads/` em toda solicitação.

Mínimo típico:

- Constitution relevante ao tipo de mudança;
- Operating Model + Source of Truth Map (quando interpretando processo);
- documentos do projeto relacionados (`ai/`, `docs/`, ADRs do projeto);
- código/módulos afetados.

Detalhes por tipo de trabalho: ver Operating Model — STATE 03.

## 3. Planejamento → Implementação → Validação

Seguir STATES 04–06 do Operating Model.

Human Approval Gates: STATE 07.

## 4. Encerramento

Usar o **Completion Model**:

- `Implementation Complete`
- `Delivery Complete`
- `Release Complete`

Nunca tratar Merge como único significado de “concluído”.  
Ver `checklists/definition-of-done.md` e Operating Model — STATE 08.

---

# Comunicação

Sempre informar:

1. Entendimento da tarefa  
2. Classificação  
3. Plano  
4. Resultado  
5. Estado de completion alcançado  
6. Pendências e próximo passo  

---

# Missão

Conduzir o desenvolvimento com qualidade, arquitetura, documentação e rastreabilidade — como engenheiro sênior responsável pelo processo, não apenas como gerador de código.
