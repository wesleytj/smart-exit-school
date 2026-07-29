# Work Item Classification

Antes de iniciar qualquer atividade, a IA deve identificar qual tipo de trabalho está sendo solicitado.

Nenhum trabalho deve começar sem essa classificação.

---

# Tipos de Work Item

## 1. Feature

Adiciona uma nova funcionalidade ao sistema.

Exemplos:

- novo módulo
- nova tela
- nova API
- novo serviço
- novo componente

Fluxo obrigatório:

Issue
→ Branch Feature
→ Desenvolvimento
→ Documentação
→ Testes
→ PR
→ Merge

---

## 2. Bug Fix

Corrige comportamento incorreto existente.

Exemplos:

- erro de lógica
- erro visual
- crash
- regressão
- bug de autenticação

Fluxo obrigatório:

Issue
→ Branch Fix
→ Correção
→ Testes
→ PR
→ Merge

---

## 3. Refactor

Melhora a estrutura interna sem alterar comportamento externo.

Exemplos:

- reorganização
- simplificação
- extração de serviços
- melhoria arquitetural

Fluxo obrigatório:

Issue
→ Branch Refactor
→ Refatoração
→ Testes completos
→ PR
→ Merge

---

## 4. Documentation

Alterações apenas em documentação.

Exemplos:

README

ADR

Roadmap

Diagramas

Fluxo:

Issue
→ Branch Docs
→ Documentação
→ PR
→ Merge

---

## 5. Infrastructure

Alterações de ambiente.

Exemplos:

GitHub Actions

Docker

Supabase

CI

ESLint

Prettier

Scripts

Fluxo:

Issue
→ Branch Chore
→ Testes
→ PR
→ Merge

---

## 6. Hotfix

Correção urgente.

Somente permitida quando:

- sistema quebrado
- produção indisponível
- falha crítica

Hotfix ignora o ciclo normal apenas quando autorizado.

Após o merge deve obrigatoriamente existir documentação da correção.

---

## 7. Research

Trabalho de investigação.

Exemplos:

analisar arquitetura

comparar soluções

avaliar biblioteca

prototipar

Research nunca gera código definitivo.

O resultado esperado é um documento contendo:

- problema
- alternativas
- decisão recomendada

---

## 8. Spike

Implementação experimental.

Pode gerar código descartável.

Nunca deve ser considerado código de produção.

---

# Como classificar

A IA deve determinar automaticamente o tipo de trabalho.

Caso exista dúvida, deve perguntar antes de iniciar.

Nunca assumir.

---

# Trabalhos mistos

Caso um pedido contenha mais de um tipo de trabalho, a IA deve separá-los.

Exemplo:

Adicionar autenticação
+
Atualizar README
+
Refatorar serviços

Resultado esperado:

Feature

Documentation

Refactor

Cada item possui seu próprio ciclo de desenvolvimento.

---

# Proibição

A IA nunca deve tratar um trabalho complexo como uma única tarefa.

Grandes implementações devem ser divididas em múltiplas Features.

---

# Regra Principal

Antes de qualquer implementação a IA deve responder internamente:

1. Qual o tipo do trabalho?

2. Existe Issue?

3. Existe Branch correta?

4. Existe documentação necessária?

5. Existe ADR necessária?

Somente após essas validações o desenvolvimento poderá iniciar.