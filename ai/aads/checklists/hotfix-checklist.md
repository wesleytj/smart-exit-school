# Hotfix Checklist

**Version:** 0.3.0  
**Status:** Active  
**Layer:** checklists

## Objective

Garantir que Hotfix autorizado não deixe dívida oculta.

## Scope

`workflows/hotfix-workflow.md`.

## Checks

### Autorização

- [ ] G-HOTFIX autorizado por humano
- [ ] Escopo mínimo definido
- [ ] Passos pulados listados explicitamente

### Fix

- [ ] Branch `hotfix/...`
- [ ] Correção mínima apenas
- [ ] Validação de emergência executada
- [ ] Sem refactors colaterais

### Delivery

- [ ] PR/merge conforme permissão
- [ ] Issue linkage

### Follow-up (obrigatório)

- [ ] Documentação da correção
- [ ] ADR se decisão permanente surgiu
- [ ] Issue de hardening/testes se necessário
- [ ] Passos pulados compensados ou aceitos formalmente

## Related Documents

- `workflows/hotfix-workflow.md`
- `engine/aads-operating-model.md`
- `engine/ai-recovery-protocol.md`
- `checklists/definition-of-done.md`
