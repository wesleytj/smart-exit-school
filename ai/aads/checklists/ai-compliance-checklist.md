# AI Compliance Checklist

**Version:** 0.3.0  
**Status:** Active  
**Layer:** checklists

## Objective

Verificação periódica de aderência ao AADS (compliance/audit leve).

## Scope

Uso contínuo por IA/humano. Não substitui auditorias históricas em `reports/`.

## Rules

Executar ao fechar um ciclo relevante (Feature/Release) ou sob demanda.

### Authority

- [ ] Constitution respeitada
- [ ] Conflitos resolvidos via Source of Truth Map
- [ ] Operating Model seguido (estados)

### Classification & planning

- [ ] Work item classificado
- [ ] Workflow correto usado
- [ ] Contexto mínimo (não AADS inteiro por default)
- [ ] Plano existiu antes de código não trivial

### Quality & completion

- [ ] Quality Validation executada com comandos do projeto
- [ ] Completion states declarados corretamente
- [ ] Nenhum “Done.” sem subestado
- [ ] Docs atualizadas quando houve impacto

### Git & delivery

- [ ] Git Workflow / checklist de entrega respeitados ou pendências humanas listadas
- [ ] Sem claim de Delivery/Release sem evidência

### Gates

- [ ] Human Approval Gates aplicados quando cabíveis
- [ ] ADRs propostas quando arquitetura permanente mudou

### Recovery

- [ ] Falhas conhecidas registradas (não ocultas)
- [ ] Recovery protocol usado se houve incidente de processo

## Related Documents

- `engine/source-of-truth-map.md`
- `engine/aads-operating-model.md`
- `engine/ai-recovery-protocol.md`
- `checklists/definition-of-done.md`
- `reports/AADS-AUDIT-REPORT.md` (histórico)
