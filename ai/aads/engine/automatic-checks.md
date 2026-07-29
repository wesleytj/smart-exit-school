# Automatic Checks

Verificações obrigatórias antes de avançar nos estados de completion.

Interpretar com:

`engine/aads-operating-model.md` — Completion Model

| Grupo | Contribui para |
|---|---|
| Quality Validation | Implementation Complete |
| Git Delivery | Delivery Complete |

Não usar comandos específicos de projeto. Utilizar os comandos/scripts definidos pelo projeto.

---

# Quality Validation

Checks técnicos. Necessários para **Implementation Complete**.

## Código / build

✓ Projeto compila (quando aplicável)

✓ Build executa (comando do projeto)

✓ Linter sem erros (comando do projeto)

✓ Testes obrigatórios do projeto aprovados (quando existirem e forem aplicáveis)

✓ Não existem erros conhecidos relacionados à implementação

## Arquitetura

✓ Mantém o padrão arquitetural

✓ Não cria duplicações

✓ Não quebra módulos existentes

✓ Não viola ADRs

## Documentação

✓ README atualizado (quando necessário)

✓ Docs atualizadas

✓ ADR criada ou atualizada (quando necessário)

✓ Roadmap atualizado (quando necessário)

## Qualidade

✓ Código legível

✓ Responsabilidade única

✓ Sem código morto

✓ Sem TODO esquecidos relacionados à tarefa

✓ Sem comentários temporários

---

# Git Delivery

Checks de entrega. Necessários para **Delivery Complete**.  
Podem depender de permissão humana.

✓ Branch correta

✓ Commit seguindo padrão

✓ Issue vinculada (quando houver Issue)

✓ PR preparado / criado conforme o fluxo

✓ Closes #Issue configurado (quando apropriado)

✓ Merge realizado quando aprovado e autorizado

Itens de Git Delivery pendentes **não** impedem declarar Implementation Complete, desde que Quality Validation tenha passado e as pendências de entrega sejam listadas.

---

# Encerramento

- Pendência em **Quality Validation** → não declarar Implementation Complete.
- Pendência em **Git Delivery** → não declarar Delivery Complete.
- Nunca tratar Merge como único significado de “concluído”.
- Declarar explicitamente o estado: Implementation Complete / Delivery Complete / Release Complete.
