# Feature Workflow

> Workflow oficial para implementação de novas funcionalidades utilizando o padrão AADS.

Sequência operacional canônica: `engine/aads-operating-model.md`.  
Este workflow aplica o modelo ao tipo Feature.

---

# Objetivo

Toda nova funcionalidade deve seguir exatamente este fluxo.

Este documento define a ordem oficial de execução das atividades de Feature.

Nenhuma etapa pode ser ignorada.

---

# Visão Geral

Receber Solicitação

↓

Compreender o Problema

↓

Pesquisar Contexto

↓

Planejar

↓

Implementar

↓

Validar

↓

Documentar

↓

Git

↓

Revisão Final

↓

Implementation Complete / Delivery Complete

---

# Etapa 1 — Receber a Solicitação

Ao receber uma nova Feature, a IA deve:

- identificar claramente o objetivo;
- entender o problema que será resolvido;
- identificar o resultado esperado;
- identificar restrições;
- verificar se existe contexto suficiente.

Caso existam dúvidas, interromper o fluxo e solicitar esclarecimentos.

Nunca assumir requisitos.

---

# Etapa 2 — Compreender o Contexto

Antes de qualquer alteração:

Consultar:

- Constituição do AADS;
- ADRs do AADS;
- Standards do AADS;
- Documentação do projeto;
- ADRs do projeto;
- Regras de negócio;
- Fluxos relacionados.

Também localizar:

- componentes;
- páginas;
- hooks;
- services;
- repositories;
- providers;
- contextos;
- utilitários;
- modelos semelhantes.

O objetivo é compreender completamente a arquitetura antes de modificar qualquer arquivo.

---

# Etapa 3 — Planejamento

Construir um plano técnico.

O plano deve responder:

- O que será alterado?
- Quais arquivos serão modificados?
- Quais arquivos novos serão criados?
- Existe código reutilizável?
- Existe dívida técnica relacionada?
- Existe impacto em outras funcionalidades?
- Existe necessidade de atualizar documentação?

Nenhuma implementação deve começar sem planejamento.

---

# Etapa 4 — Implementação

Durante a implementação:

- alterar apenas o necessário;
- preservar arquitetura;
- evitar duplicação;
- reutilizar código existente;
- manter nomenclaturas consistentes;
- manter baixo acoplamento;
- preservar compatibilidade.

Nunca implementar funcionalidades fora do escopo.

---

# Etapa 5 — Validação

Após implementar:

Executar o Feature Checklist.

Obrigatoriamente validar:

- build;
- lint;
- arquitetura;
- documentação;
- consistência;
- qualidade.

Caso exista qualquer erro relacionado à Feature, retornar para a Implementação.

---

# Etapa 6 — Documentação

Verificar se houve impacto em:

- README;
- documentação técnica;
- regras de negócio;
- roadmap;
- ADRs;
- fluxos;
- comentários relevantes.

Atualizar somente quando necessário.

A documentação faz parte da entrega.

---

# Etapa 7 — Git

Executar obrigatoriamente o Git Workflow para avançar a **Delivery Complete**.

Validar:

- Branch correta;
- Commits organizados;
- Issue relacionada;
- Pull Request preparado;
- "Closes #<número>" presente na descrição do PR;
- Branch pronta para Merge.

Nunca atingir Delivery Complete sem rastreabilidade.  
Pendências de Merge por permissão humana não impedem Implementation Complete.

---

# Etapa 8 — Revisão Técnica

Realizar uma revisão completa da implementação.

Responder internamente:

- Existe código duplicado?
- Existe simplificação possível?
- Existe responsabilidade incorreta?
- Existe quebra arquitetural?
- Existe risco de regressão?
- Existe documentação desatualizada?
- Existe código morto?

Caso exista qualquer problema, corrigir antes de continuar.

---

# Etapa 9 — Encerramento

Interpretar com o Completion Model (`engine/aads-operating-model.md`):

- **Implementation Complete** quando a validação técnica finaliza (Feature Checklist, qualidade, documentação aplicável, DoD de implementação).
- **Delivery Complete** quando o Git Workflow / Git Checklist de entrega for finalizado conforme permissões.

Executar:

- Definition of Done;
- Git Checklist;
- Feature Checklist.

Declarar explicitamente o estado alcançado. Não usar apenas “Feature concluída” sem o subestado.

---

# Fluxo Oficial

1. Receber Solicitação
2. Compreender o Problema
3. Compreender o Contexto
4. Planejar
5. Implementar
6. Validar
7. Atualizar Documentação
8. Executar Git Workflow
9. Revisão Final
10. Declarar Implementation Complete / Delivery Complete

---

# Critérios para Conclusão

**Implementation Complete** quando:

- todos os requisitos do escopo foram implementados;
- gates técnicos / Feature Checklist aprovados;
- o projeto continua compilando e funcionando no alcance validável;
- a documentação aplicável está consistente.

**Delivery Complete** quando, além disso:

- checklists de entrega Git aprovados (ou pendências humanas listadas);
- a rastreabilidade da Issue foi preservada no fluxo Git.

---

# Regra Permanente

A IA é responsável por conduzir este workflow.

O desenvolvedor é responsável apenas por informar o objetivo da Feature.

O processo pertence integralmente à IA.

Nenhuma Feature pode ignorar qualquer etapa deste documento.

---

# Related Documents

- `engine/aads-operating-model.md`
- `checklists/feature-checklist.md`
- `checklists/definition-of-done.md`
- `checklists/git-checklist.md`
- `standards/git-workflow.md`
- `standards/work-item-classification.md`
- `INDEX.md`