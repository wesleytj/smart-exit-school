# Git Checklist

## Objetivo

Esta checklist define as validações obrigatórias relacionadas ao Git.

Ela **não** redefine o Completion Model.

Interpretar com:

`engine/aads-operating-model.md` — Completion Model

---

# Separação de estados

| Estado | O que esta checklist cobre | Quem normalmente executa |
|---|---|---|
| Implementation Complete | Preparação Git local alcançável (branch correta, commits limpos, escopo) — **sem exigir Merge** | IA |
| Delivery Complete | Push, PR, Merge, exclusão de branch, encerramento de Issue conforme permissões | Humano e/ou IA |

A IA **pode** declarar Implementation Complete com itens de entrega Git ainda pendentes, desde que liste as pendências.

**Delivery Complete** só pode ser declarado quando os itens de entrega aplicáveis estiverem concluídos ou quando o ambiente não os exigir.

As regras Git existentes em `standards/git-workflow.md` e `standards/branch-strategy.md` permanecem válidas.

---

# Parte A — Validação da implementação (Git readiness)

Contribui para **Implementation Complete** (preparação), não exige Merge.

## Branch

- [ ] Existe uma branch exclusiva para a tarefa.
- [ ] O nome da branch segue o padrão definido pelo projeto.
- [ ] A branch está baseada na branch correta.

## Commits

- [ ] Todos os commits possuem mensagens claras.
- [ ] Não existem commits temporários.
- [ ] Não existem commits "teste".
- [ ] Não existem commits "wip".
- [ ] Commits representam etapas lógicas.

## Escopo / Issue

Quando houver Issue vinculada:

- [ ] Branch vinculada à Issue correta.
- [ ] Desenvolvimento corresponde ao escopo da Issue.
- [ ] Nenhuma alteração fora do escopo foi incluída.

## Repositório (local)

- [ ] Nenhum arquivo temporário destinado a commit.
- [ ] Nenhum arquivo de teste esquecido.
- [ ] Estado do working tree conhecido (`git status`).

---

# Parte B — Entrega Git (Delivery)

Contribui para **Delivery Complete**.  
Pode depender de permissões humanas.

## Sincronização

- [ ] Branch atual sincronizada com a branch principal quando necessário.
- [ ] Não existem conflitos pendentes.

## Pull Request

Quando houver PR:

- [ ] PR criado.
- [ ] Template preenchido.
- [ ] PR vinculado à Issue.
- [ ] PR utiliza "Closes #NúmeroDaIssue" quando apropriado.
- [ ] Build passou.
- [ ] Lint passou.

## Merge

Quando aprovado e autorizado:

- [ ] Merge realizado.
- [ ] Branch removida.
- [ ] Issue encerrada.
- [ ] PR encerrado.

## Repositório (pós-entrega)

- [ ] git status limpo no contexto da entrega.
- [ ] Nenhum conflito de merge pendente.

---

# Regra obrigatória

1. Itens da **Parte A** pendentes impedem declarar Implementation Complete com Git readiness adequado (a menos que o trabalho não use Git — caso excepcional documentado).
2. Itens da **Parte B** pendentes impedem **Delivery Complete**.
3. A IA nunca deve declarar Delivery Complete enquanto itens aplicáveis da Parte B estiverem abertos.
4. Se um item da Parte B não puder ser executado (ex.: falta de permissão no GitHub), a IA deve:
   - manter Implementation Complete se a Parte A e o DoD de implementação estiverem ok;
   - informar exatamente qual etapa depende do humano;
   - não ignorar a checklist.

A ausência de acesso ao GitHub não autoriza omitir pendências de Delivery.
