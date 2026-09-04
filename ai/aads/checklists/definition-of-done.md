# Definition of Done (DoD)

## Objetivo

A Definition of Done estabelece os critérios mínimos para avaliar a conclusão de uma tarefa sob o AADS.

A conclusão **não** é um único booleano e **não** significa automaticamente Merge.

Interpretar sempre com o Completion Model:

`engine/aads-operating-model.md` — STATE 08 / Completion Model

---

# Completion Model (referência)

| Estado | Significado |
|---|---|
| Implementation Complete | Escopo implementado e validado; entrega Git pode estar pendente |
| Delivery Complete | Alteração integrada ao fluxo Git conforme permissões |
| Release Complete | Disponível para usuários (equipe/projeto) |

A IA pode declarar **Implementation Complete** sem Merge.  
**Delivery Complete** exige os critérios Git aplicáveis.  
É proibido dizer apenas “tarefa concluída” omitindo qual estado foi alcançado quando Delivery ou Release ainda pendem.

---

# Regra Fundamental

Enquanto houver pendências do estado declarado, a IA deve listá-las explicitamente.

Caso um item não possa ser executado por falta de permissão humana, isso bloqueia **Delivery Complete**, não apaga o progresso de **Implementation Complete**.

---

# Critérios — Implementation Complete

Todos os itens abaixo devem ser atendidos (quando aplicáveis ao tipo de trabalho):

## Código

- [ ] Implementação concluída no escopo.
- [ ] Nenhum código parcialmente implementado no escopo.
- [ ] Nenhum TODO relacionado à tarefa.
- [ ] Nenhum FIXME relacionado à tarefa.
- [ ] Nenhum código morto introduzido.
- [ ] Nenhuma duplicação desnecessária.

## Build / qualidade alcançável

- [ ] Projeto compila (quando aplicável).
- [ ] Build executado com sucesso (comandos do projeto).
- [ ] Lint executado (comandos do projeto).
- [ ] Nenhum erro novo introduzido relacionado à tarefa.

## Arquitetura

- [ ] Respeitou a arquitetura do projeto.
- [ ] Não criou dependências circulares.
- [ ] Não violou ADRs existentes.
- [ ] Não criou soluções paralelas para problemas já resolvidos.

## Documentação

Quando aplicável:

- [ ] README atualizado.
- [ ] Documentação técnica atualizada.
- [ ] ADR criada ou atualizada.
- [ ] Roadmap atualizado.
- [ ] Changelog atualizado.

## Revisão

- [ ] Código revisado.
- [ ] Imports desnecessários removidos.
- [ ] Arquivos obsoletos removidos.
- [ ] Nomes consistentes.
- [ ] Sem warnings relevantes relacionados à tarefa.

---

# Critérios — Delivery Complete

Além de Implementation Complete:

## Git

- [ ] Itens de entrega do `checklists/git-checklist.md` concluídos **ou** explicitamente bloqueados por permissão humana (com pendências listadas).
- [ ] Fluxo oficial de Git respeitado no que for executável no ambiente.

**Merge não é sinônimo automático de Definition of Done.**  
Merge (quando requerido e autorizado) faz parte de Delivery Complete.

---

# Critérios — Release Complete

Fora da autoridade padrão da IA, salvo atribuição explícita do projeto.

- [ ] Processo de release do projeto atendido (quando aplicável).

---

## Resultado Final

Antes de responder sobre conclusão, a IA deve:

1. Verificar item a item os critérios do estado pretendido.
2. Declarar o estado alcançado (`Implementation Complete` / `Delivery Complete` / `Release Complete`).
3. Listar exatamente o que impede o próximo estado, se houver.

É proibido declarar um estado de completion ignorando critérios deste documento ou do Operating Model.
