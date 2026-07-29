# Development Workflow

> Workflow oficial de desenvolvimento do AADS (AllTech AI Development Standard).

Sequência operacional canônica: `engine/aads-operating-model.md`.  
Este standard descreve o fluxo geral; o Completion Model define os estados de conclusão.

---

# Objetivo

Este documento define a sequência obrigatória que uma Inteligência Artificial deve seguir durante qualquer atividade de desenvolvimento.

O workflow é obrigatório.

Nenhuma fase pode ser ignorada.

Nenhuma implementação pode ser declarada **Implementation Complete** antes da validação técnica aplicável.  
**Delivery Complete** exige o Git Workflow aplicável — Merge não é o único significado de conclusão.

---

# Fluxo Geral

Todo desenvolvimento deverá seguir exatamente esta ordem:

```
Receber tarefa

↓

Entender contexto

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

Definition of Done

↓

Implementation Complete / Delivery Complete
```

Referência: `engine/aads-operating-model.md` — Completion Model.

---

# Fase 0 — Recebimento da tarefa

Ao receber uma nova solicitação, a IA deve identificar:

- objetivo da tarefa;
- impacto esperado;
- arquivos possivelmente afetados;
- riscos conhecidos;
- documentação relacionada.

A implementação nunca deve começar imediatamente.

Antes disso, a IA deverá compreender completamente o contexto.

---

# Fase 1 — Leitura do projeto

Antes de modificar qualquer arquivo, a IA deverá ler toda a documentação necessária.

Sempre nesta ordem:

1. Constitution
2. ADRs do AADS
3. Documentação do projeto
4. ADRs do projeto
5. Roadmap
6. Issues relacionadas
7. Arquivos diretamente envolvidos

Caso exista qualquer conflito entre documentos, a IA deve interromper a implementação e informar a inconsistência.

Jamais assumir comportamento.

---

# Fase 2 — Planejamento

Após compreender o contexto, a IA deverá elaborar um plano.

Esse plano deve conter:

- objetivo;
- abordagem escolhida;
- arquivos que serão alterados;
- possíveis impactos;
- riscos;
- documentação que precisará ser atualizada.

Nenhuma alteração deve ocorrer antes da conclusão deste planejamento.

---

# Fase 3 — Implementação

Durante a implementação, a IA deverá:

- preservar arquitetura existente;
- evitar duplicação;
- reutilizar componentes existentes;
- manter consistência de nomenclatura;
- respeitar todos os padrões do projeto;
- implementar apenas o necessário para cumprir a tarefa.

É proibido realizar refatorações não relacionadas sem autorização explícita.

---

# Fase 4 — Validação

Após implementar, a IA deverá verificar:

- erros de compilação;
- erros de lint;
- erros de tipagem;
- erros de runtime identificáveis;
- conflitos arquiteturais;
- regressões visíveis.

Se qualquer erro existir, **Implementation Complete** ainda não foi alcançado.

---

# Fase 5 — Documentação

Toda alteração relevante deve refletir a documentação.

A IA deverá verificar se existe necessidade de atualizar:

- README;
- documentação técnica;
- ADRs;
- roadmap;
- changelog;
- diagramas;
- comentários importantes.

Documentação faz parte da implementação.

---

# Fase 6 — Git

Antes de declarar **Delivery Complete**, a IA deverá verificar:

- branch correta;
- commits organizados;
- nome da branch;
- Issue vinculada;
- Pull Request;
- mensagens de commit;
- templates utilizados.

Caso exista inconsistência corrigível pela IA, corrigir antes da entrega.  
Pendências por permissão humana bloqueiam Delivery Complete e devem ser listadas; não impedem Implementation Complete.

---

# Fase 7 — Definition of Done

Aplicar `checklists/definition-of-done.md` com o Completion Model:

**Implementation Complete** quando:

- objetivos de escopo atingidos;
- não existirem erros relacionados;
- documentação aplicável atualizada;
- build/lint/testes obrigatórios do projeto aprovados no alcance validável.

**Delivery Complete** quando, além disso:

- Git consistente conforme checklist de entrega;
- rastreabilidade completa no fluxo Git aplicável.

Caso itens de implementação estejam pendentes, Implementation Complete permanece aberto.  
Caso apenas entrega Git esteja pendente, declarar Implementation Complete e listar Delivery pending.

---

# Encerramento

A IA deve declarar explicitamente:

- Implementation Complete  
- Delivery Complete  
- Release Complete (quando aplicável)

Caso alguma fase não tenha sido executada, informar qual permanece pendente.

Nunca afirmar Delivery Complete se a entrega Git aplicável não foi finalizada.  
Nunca exigir Merge como único critério para reconhecer Implementation Complete.
