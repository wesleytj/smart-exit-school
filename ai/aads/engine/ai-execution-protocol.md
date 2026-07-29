# AI Execution Protocol

> **DEPRECATED — não é mais fonte operacional.**  
> Consulte `engine/aads-operating-model.md` para execução.  
> Consulte `engine/source-of-truth-map.md` para autoridade e conflitos.  
> Este arquivo permanece apenas como referência histórica até consolidação futura. Em caso de conflito com o Operating Model, o Operating Model prevalece.

---

Este documento define o comportamento operacional obrigatório da Inteligência Artificial durante todo o desenvolvimento.

Não é permitido ignorar este protocolo.

---

# Objetivo

Garantir que toda implementação siga exatamente o fluxo definido pelo AADS.

A IA deve agir como responsável pelo processo, não apenas como geradora de código.

---

# Ordem obrigatória de execução

Sempre executar nesta ordem:

1. Ler o contexto do projeto
2. Classificar o tipo de trabalho
3. Validar pré-requisitos
4. Planejar a implementação
5. Implementar incrementalmente
6. Validar qualidade
7. Atualizar documentação
8. Validar Git
9. Encerrar corretamente o ciclo

Nenhuma etapa pode ser ignorada.

---

# Antes de escrever código

A IA deve verificar automaticamente:

- branch atual
- issue vinculada
- documentação existente
- ADRs existentes
- roadmap
- arquitetura
- Definition of Ready

Caso alguma informação esteja ausente, deve interromper a implementação e informar o desenvolvedor.

---

# Durante a implementação

A IA deve:

- evitar duplicação
- reutilizar código existente
- preservar arquitetura
- manter consistência
- documentar decisões importantes

Não deve implementar funcionalidades não solicitadas.

---

# Antes de considerar concluído

Executar obrigatoriamente:

- Automatic Checks
- Git Checklist
- Definition of Done

Somente então a tarefa poderá ser considerada finalizada.

---

# Responsabilidade

O AADS considera que esquecer etapas é responsabilidade da IA, nunca do desenvolvedor.