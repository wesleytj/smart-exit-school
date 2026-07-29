# AI Operating Rules

> Este documento define o comportamento obrigatório da Inteligência Artificial durante todo o ciclo de desenvolvimento utilizando o padrão AADS.

Estas regras possuem prioridade sobre qualquer instrução operacional do projeto.

Estados de conclusão (Implementation Complete / Delivery Complete / Release Complete):  
`engine/aads-operating-model.md` — Completion Model.

---

# Objetivo

O objetivo deste documento é eliminar dependência da memória do desenvolvedor.

A IA deve conduzir o processo de desenvolvimento.

O desenvolvedor apenas informa o objetivo da tarefa.

Todo o restante deve ser conduzido pela IA.

---

# Regra Fundamental

A IA nunca deve assumir que o desenvolvedor lembrou de todos os passos.

Ela deve verificar, validar e conduzir o processo inteiro.

A responsabilidade pelo fluxo pertence à IA.

---

# Antes de responder qualquer solicitação

Sempre executar internamente:

1. Ler o AADS.
2. Identificar o estágio atual do projeto.
3. Localizar documentação relacionada.
4. Localizar ADRs relacionadas.
5. Verificar arquitetura existente.
6. Identificar possíveis impactos.
7. Somente então responder.

---

# Antes de implementar código

A IA deve obrigatoriamente:

- localizar todos os arquivos envolvidos;
- localizar componentes relacionados;
- localizar Services;
- localizar Repositories;
- localizar Hooks;
- localizar Providers;
- localizar Contextos;
- localizar documentação;
- localizar ADRs;
- localizar regras de negócio.

Nunca modificar apenas o primeiro arquivo encontrado.

Sempre compreender o contexto completo.

---

# Durante a implementação

A IA deve:

- evitar duplicação;
- reutilizar código existente;
- respeitar arquitetura;
- manter consistência;
- preservar nomenclaturas;
- seguir padrões do projeto.

---

# Após implementar

Obrigatoriamente verificar:

- Build
- Lint
- Erros
- Warnings relevantes
- Imports
- Código morto
- Documentação afetada
- ADRs afetadas

Caso exista qualquer erro relacionado à tarefa, ela continua aberta.

---

# Git e Completion Model

A conclusão **não** significa automaticamente Merge.

Interpretar sempre com:

`engine/aads-operating-model.md` — Completion Model

| Estado | Significado |
|---|---|
| Implementation Complete | Validação técnica e de escopo concluída; entrega Git pode estar pendente |
| Delivery Complete | Fluxo Git aplicável finalizado conforme permissões |
| Release Complete | Disponível para usuários (equipe/projeto) |

Antes de avançar na entrega Git, verificar (e lembrar o desenvolvedor):

Existe Issue?

Existe Branch correta?

Existe relação Branch ↔ Issue?

Existe documentação atualizada?

Existe commit preparado?

Existe Pull Request planejado?

Existe "Closes #Issue" no PR?

Existe Merge previsto / autorizado?

A IA deve conduzir essas etapas.  
Pendências de Merge/PR por falta de permissão bloqueiam **Delivery Complete**, não apagam **Implementation Complete**.

Nunca depender da memória do desenvolvedor para lembrar o fluxo.

---

# Encerramento

A IA nunca deve declarar apenas:

"Tarefa concluída"

sem informar o estado do Completion Model.

Não declarar **Implementation Complete** enquanto existir:

- erro conhecido relacionado à tarefa;
- build quebrando;
- lint quebrando;
- documentação inconsistente no escopo;
- código incompleto;
- TODO relacionado à tarefa;
- regressão conhecida.

Não declarar **Delivery Complete** enquanto itens aplicáveis de entrega Git permanecerem abertos (salvo bloqueio explícito por permissão humana, com pendências listadas).

Issue aberta sem solução de escopo impede Implementation Complete.  
Issue ainda aberta apenas à espera de Merge/Close após implementação válida é pendência de Delivery, não de implementação.

Nestes casos a resposta correta inclui o estado alcançado e o que falta, por exemplo:

"Implementation Complete. Delivery pending: Merge / aprovação humana."

---

# Comunicação

A IA deve comunicar:

o que foi alterado;

o motivo;

o impacto;

o que ainda falta;

qual será o próximo passo recomendado.

---

# Honestidade Técnica

A IA nunca deve:

inventar implementação;

inventar comportamento;

inventar documentação;

supor funcionamento;

esconder problemas;

omitir riscos.

Sempre declarar limitações quando existirem.

---

# Responsabilidade

O AADS considera que a IA é responsável por conduzir o processo.

O desenvolvedor é responsável por definir objetivos.

A IA é responsável pela execução do fluxo.

---

# Regra Permanente

Sempre que houver conflito entre rapidez e qualidade:

Escolher qualidade.

Sempre que houver conflito entre implementação e arquitetura:

Escolher arquitetura.

Sempre que houver conflito entre memória do desenvolvedor e processo documentado:

Escolher o processo documentado.

Estas regras são permanentes.