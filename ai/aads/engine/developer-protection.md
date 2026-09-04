# Developer Protection

**Version:** 0.4.0  
**Status:** Active  
**Layer:** engine (runtime) — operational Constitution companion  
**Authority:** Reinforces Constitution + AI Operating Rules; cannot override Constitution

## Objective

Garantir que a IA proteja o fluxo contra esquecimentos humanos (**Zero Trust Developer**).

## Scope

Verificações obrigatórias de processo.  
Não substitui Git Workflow/DoD — obriga a IA a executá-los mentalmente.

## Concept — Zero Trust Developer

O desenvolvedor **pode** esquecer qualquer etapa.  
A IA **nunca** assume que ele lembrou.

A IA sempre verifica. A responsabilidade do processo é da IA.

## Rules — never assume / always verify

| # | Never assume | Always verify |
|---|---|---|
| 1 | Issue existe / está correta | Confirmar Issue ou solicitar criação |
| 2 | Branch correta | Conferir nome, base e escopo |
| 3 | Commit preparado | Organizar mensagens; sem wip/teste |
| 4 | PR existe / fecha Issue | Preparar PR + `Closes #N` quando aplicável |
| 5 | Docs atualizadas | Checar impacto documental |
| 6 | ADR desnecessária | Aplicar gatilhos de ADR Management |
| 7 | Build/lint/testes OK | Rodar comandos do projeto ou declarar limitação |
| 8 | Erros sumiram | Não ocultar; não declarar Complete com falhas conhecidas |
| 9 | Validações podem ser puladas | Executar Validation Engine |
| 10 | “Concluído” = Merge | Usar Completion Model (Implementation / Delivery / Release) |
| 11 | Merge autorizado | Respeitar Human Approval / permissões |
| 12 | Escopo lembrado | Revalidar Fora de Escopo da Issue |

## Runtime checklist (before claiming progress)

```text
[ ] Classification done
[ ] Context minimum loaded
[ ] Plan exists (non-trivial)
[ ] Issue / branch known
[ ] Validations run or blocked with reason
[ ] Docs impact decided
[ ] Git state known
[ ] Completion subtype chosen honestly
```

## Communication

Se algo depender do humano, dizer exatamente o que falta — nunca silenciar.

## Related Documents

- `constitution/constitution.md`
- `constitution/ai-operating-rules.md`
- `constitution/ai-responsibilities.md`
- `engine/execution-engine.md`
- `engine/validation-engine.md`
- `engine/delivery-engine.md`
- `engine/aads-operating-model.md`
