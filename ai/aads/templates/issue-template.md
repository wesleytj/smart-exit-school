# Issue Template

> Template oficial para criação de Issues no padrão AADS.

---

# Título

Deve ser curto, objetivo e iniciar com um verbo.

Exemplos:

- Implement Platform Admin authentication
- Refactor schoolService architecture
- Fix tenant session persistence
- Create Pickup Events repository

---

# Objetivo

Descreva claramente o problema que esta Issue resolve.

Explique o motivo da existência da tarefa.

Nunca descreva apenas a implementação.

---

# Contexto

Descreva a situação atual.

Inclua:

- comportamento atual;
- limitações;
- problemas encontrados;
- documentação relacionada;
- ADRs relacionadas.

---

# Escopo

Liste exatamente o que faz parte desta Issue.

Exemplo:

- implementar login Platform Admin;
- criar Provider;
- integrar RPC;
- proteger rota administrativa.

---

# Fora do Escopo

Liste explicitamente o que NÃO faz parte desta Issue.

Exemplo:

- Auth Tenant;
- Pickup Core;
- Gates;
- TV Panel.

Isso evita crescimento descontrolado da Feature.

---

# Impacto Esperado

Marcar todos os itens aplicáveis.

- [ ] Frontend
- [ ] Backend
- [ ] Banco de Dados
- [ ] Supabase
- [ ] Auth
- [ ] RLS
- [ ] API
- [ ] Documentação
- [ ] Git Workflow
- [ ] ADR
- [ ] CI/CD

---

# Arquivos Provavelmente Afetados

Exemplo:

- Login.jsx
- authService.js
- platformAdminService.js

Não precisa ser uma lista definitiva.

Serve apenas para planejamento.

---

# Dependências

Relacionar:

- Issues
- ADRs
- Pull Requests
- Features

Exemplo:

Depends on:

- ADR-028
- Issue #21

---

# Critérios de Aceitação

A Issue atinge Delivery Complete (após Implementation Complete) quando:

- [ ] Todos os requisitos forem implementados
- [ ] Build executado com sucesso
- [ ] Lint executado com sucesso
- [ ] Não existirem erros conhecidos relacionados à tarefa
- [ ] Arquitetura permanecer consistente
- [ ] Documentação atualizada quando necessário
- [ ] ADR criada ou atualizada quando necessário
- [ ] Git Checklist aprovado
- [ ] Definition of Done aprovada

---

# Critérios de Reprovação

A Issue não pode ser encerrada caso exista:

- erro de build;
- erro de lint;
- funcionalidade parcialmente implementada;
- documentação inconsistente;
- regressão conhecida;
- TODO relacionado à própria Issue;
- violação das ADRs;
- quebra arquitetural.

---

# Plano de Implementação

A IA deve propor uma sequência lógica antes da implementação.

Exemplo:

1. Analisar arquitetura
2. Identificar impacto
3. Implementar
4. Executar testes
5. Atualizar documentação
6. Revisar código
7. Validar checklists
8. Preparar Git
9. Abrir Pull Request

---

# Definition of Done

Consultar obrigatoriamente:

checklists/definition-of-done.md

---

# Observações

Campo livre para informações adicionais.

---

# Responsabilidades da IA

Antes de iniciar qualquer implementação, a IA deve verificar:

- Existe alguma ADR relacionada?
- Existe outra Issue semelhante?
- Existe documentação que será impactada?
- Existe alguma dependência pendente?
- A tarefa está suficientemente clara?
- O escopo está bem definido?
- Existe risco de violar alguma regra do AADS?

Caso alguma resposta seja negativa ou gere dúvida, a IA deve interromper a implementação e solicitar esclarecimentos ao desenvolvedor.

---

# Regra Permanente

Nenhuma implementação deve iniciar sem uma Issue claramente definida.

A Issue representa o contrato entre o desenvolvedor e a IA.

Ela deve conter contexto suficiente para que qualquer pessoa consiga compreender o objetivo da implementação sem depender de conversas paralelas.