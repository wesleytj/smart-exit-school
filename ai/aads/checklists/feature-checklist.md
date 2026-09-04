# Feature Checklist

> Checklist obrigatório para implementação de Features no AADS.

Interpretar com o Completion Model:

`engine/aads-operating-model.md` — STATE 08 / Completion Model

---

# Objetivo

Este checklist valida uma Feature em **estados distintos**.  
Nunca tratar “Feature concluída / done / finalizado” como um único booleano.

| Estado | O que este checklist cobre |
|---|---|
| Implementation Complete | Código, validações técnicas, documentação necessária, critérios funcionais |
| Delivery Complete | Branch/PR/revisão/merge aplicáveis e regras Git de entrega |
| Release Complete | Disponibilização para usuários / processo de release |

Caso um Gate de Implementation falhe, a Feature permanece em desenvolvimento.  
Caso só Delivery falhe, declarar **Implementation Complete** e listar Delivery pending.

A IA nunca deve assumir que a tarefa terminou apenas porque o código foi escrito.

---

# Gates — Implementation Complete

Gates 1–6 e 8 alimentam **Implementation Complete**.

---

## Gate 1 — Compreensão

Antes de escrever qualquer linha de código, validar:

- [ ] A solicitação foi compreendida.
- [ ] O objetivo da Feature está claro.
- [ ] O impacto da alteração foi identificado.
- [ ] Foram identificados arquivos relacionados.
- [ ] Foram identificadas ADRs relacionadas.
- [ ] Foram identificadas regras de negócio relacionadas.
- [ ] Foram identificadas possíveis dependências.
- [ ] Não existe implementação semelhante que possa ser reutilizada.

Se existir qualquer dúvida, interromper a implementação e solicitar esclarecimentos.

---

## Gate 2 — Arquitetura

Antes da implementação:

- [ ] A solução respeita a arquitetura existente.
- [ ] Não cria duplicação desnecessária.
- [ ] Não viola Separation of Concerns.
- [ ] Não aumenta acoplamento sem necessidade.
- [ ] Mantém baixo nível de complexidade.
- [ ] Mantém legibilidade.
- [ ] Segue os padrões definidos pelo projeto.
- [ ] Segue todas as ADRs.

---

## Gate 3 — Implementação

Durante a implementação:

- [ ] Implementar apenas o necessário.
- [ ] Não alterar código não relacionado.
- [ ] Não remover funcionalidades existentes.
- [ ] Não introduzir comportamento inesperado.
- [ ] Evitar código morto.
- [ ] Evitar comentários desnecessários.
- [ ] Reutilizar componentes existentes.
- [ ] Reutilizar serviços existentes.
- [ ] Reutilizar repositories existentes.
- [ ] Reutilizar utilitários existentes.

---

## Gate 4 — Consistência

Após implementar:

- [ ] Não existem duplicações.
- [ ] Imports estão organizados.
- [ ] Código segue padrão do projeto.
- [ ] Nome de variáveis consistente.
- [ ] Nome de funções consistente.
- [ ] Nome de arquivos consistente.
- [ ] Estrutura de pastas preservada.

---

## Gate 5 — Qualidade (técnica)

Validar com os comandos/scripts do projeto:

- [ ] Lint do projeto executado sem erros relacionados à tarefa.
- [ ] Build do projeto executado com sucesso (quando aplicável).
- [ ] Testes obrigatórios do projeto aprovados (quando existirem e forem aplicáveis).

Se existir qualquer erro relacionado à Feature:

**Implementation Complete** ainda não foi alcançado.

Nunca ignorar:

- warnings importantes
- erros de compilação
- erros de lint

---

## Gate 6 — Documentação

Verificar se houve necessidade de atualizar:

- [ ] README
- [ ] documentação técnica
- [ ] ADR
- [ ] roadmap
- [ ] regras de negócio
- [ ] fluxos
- [ ] changelog
- [ ] comentários relevantes

Caso alguma documentação aplicável esteja desatualizada, atualizar antes de declarar Implementation Complete.

---

## Gate 8 — Revisão Técnica

Realizar uma revisão completa da implementação.

Perguntar internamente:

- O código pode ser simplificado?
- Existe duplicação?
- Existe código morto?
- Existe responsabilidade incorreta?
- Existe violação de arquitetura?
- Existe risco de regressão?
- Existe impacto em segurança?
- Existe impacto em performance?
- Existe impacto em UX?

Caso a resposta seja SIM para qualquer item, corrigir antes de continuar.

---

## Gate 9A — Critérios de Implementation Complete

Confirmar:

- [ ] Todos os requisitos do escopo foram implementados.
- [ ] Nenhum requisito ficou parcialmente implementado.
- [ ] Não existem erros conhecidos relacionados.
- [ ] O projeto continua compilando (quando aplicável).
- [ ] O projeto continua funcionando no alcance validável.
- [ ] A documentação necessária foi atualizada (ou N/A justificado).
- [ ] Critérios funcionais / de aceite do escopo foram atendidos.
- [ ] A Feature está pronta para revisão de entrega (PR), se aplicável.

Somente então declarar:

> Implementation Complete

Delivery e Release podem ainda estar pendentes.

---

# Gates — Delivery Complete

Gate 7 e itens de entrega Git alimentam **Delivery Complete**.  
Seguir `standards/git-workflow.md` e `checklists/git-checklist.md`.

---

## Gate 7 — Git (readiness + entrega)

### Readiness (pode acompanhar Implementation Complete)

- [ ] Branch correta.
- [ ] Commits organizados.
- [ ] Nenhum arquivo temporário destinado a commit.
- [ ] Nenhum console.log esquecido.
- [ ] Nenhum TODO temporário relacionado à Feature.
- [ ] Nenhum FIXME temporário relacionado à Feature.
- [ ] Nenhum arquivo de teste acidental.

### Entrega (Delivery Complete)

- [ ] Push realizado (quando aplicável / autorizado).
- [ ] Pull Request preparado ou criado.
- [ ] Revisão de PR conforme política do projeto.
- [ ] Merge realizado quando aprovado e autorizado.
- [ ] Issue linkage / `Closes #N` quando apropriado.
- [ ] Branch removida após merge quando aplicável.

Pendências de Merge por permissão humana **não** impedem Implementation Complete; impedem Delivery Complete.

---

## Gate 9B — Critérios de Delivery Complete

Além de Implementation Complete:

- [ ] Git Checklist de entrega aplicável concluído, ou pendências humanas listadas.
- [ ] Rastreabilidade Issue ↔ Branch ↔ PR preservada.

Declarar:

> Delivery Complete

somente quando os itens de entrega aplicáveis estiverem satisfeitos.

---

# Release Complete

Fora da autoridade padrão da IA, salvo atribuição explícita do projeto.

- [ ] Processo de release do projeto atendido (quando a Feature faz parte de um release).
- [ ] Disponibilização para usuários conforme o fluxo do projeto.

Declarar:

> Release Complete

somente quando o release aplicável for concluído pela equipe/projeto.

Referência de artefato: `templates/release-template.md` (quando usado).

---

# Regra Permanente

A IA deve assumir que o desenvolvedor pode esquecer etapas.

A responsabilidade por validar este checklist pertence à IA.

---

# Regra de Ouro

A IA nunca deve responder apenas:

"Concluído." / "Done." / "Feature finalizada."

Sem declarar o estado do Completion Model.

Exemplos corretos:

- `Implementation Complete. Delivery pending: PR/Merge.`
- `Implementation Complete. Delivery Complete.`
- `Implementation Complete. Delivery Complete. Release pending.`

Caso Gates de Implementation falhem:

> A implementação avançou, porém Implementation Complete não foi alcançado. Pendências: Gates X.

Caso só Delivery falhe:

> Implementation Complete. Delivery pending: Gates/itens Y.
