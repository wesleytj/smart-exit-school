# Git Workflow

> Este documento define o fluxo oficial de utilização do Git em projetos que seguem o AADS.

Todo desenvolvimento deve possuir rastreabilidade completa.

A IA é responsável por garantir que nenhuma etapa seja esquecida.

O desenvolvedor nunca deve precisar lembrar manualmente do processo.

**Completion Model:** `engine/aads-operating-model.md`

| Este documento define | Este documento NÃO define sozinho |
|---|---|
| Branch, commits, PR, revisão, merge, rastreabilidade | Quando a implementação técnica está pronta |
| Caminho para **Delivery Complete** | **Implementation Complete** (qualidade/código/docs do escopo) |
| Encerramento Git da entrega | **Release Complete** (publicação para usuários) |

**Implementation Complete** pode ocorrer **antes** de Merge.  
**Delivery Complete** exige os passos Git aplicáveis deste workflow (conforme permissões).

---

# Objetivo

Garantir que toda alteração no projeto seja:

- rastreável;
- reproduzível;
- revisável;
- segura;
- documentada.

Não existe desenvolvimento fora do Git.

---

# Fluxo Oficial

Toda implementação deve seguir exatamente esta ordem.

```text
Issue

↓

Branch

↓

Implementação

↓

Documentação

↓

Quality Gates

↓

Commit

↓

Push

↓

Pull Request

↓

Merge

↓

Delete Branch

↓

Close Issue
```

Nenhuma etapa de entrega aplicável pode ser ignorada para declarar **Delivery Complete**.  
Etapas ainda não executáveis por permissão humana devem ser listadas como Delivery pending — isso não cancela Implementation Complete.

---

# 1. Issue

Toda alteração deve possuir uma Issue correspondente.

A Issue representa o problema que será resolvido.

A IA deve verificar:

- existe Issue?
- ela descreve corretamente o problema?
- ela possui escopo claro?

Caso não exista, a IA deve solicitar sua criação antes da implementação.

---

# 2. Branch

Cada Issue deve possuir exatamente uma Branch principal.

Formato:

```
feature/numero-descricao
```

Exemplos:

```
feature/24-platform-admin

feature/31-auth-tenant

fix/41-login-loop

hotfix/52-crash-monitor

docs/18-documentation-update
```

Nunca trabalhar diretamente na:

- main
- master

---

# 3. Implementação

Durante a implementação a IA deve:

- respeitar a arquitetura;
- seguir as ADRs;
- seguir Coding Rules;
- atualizar documentação quando necessário;
- não introduzir código morto;
- evitar duplicação;
- manter o projeto compilando continuamente.

---

# 4. Atualização da documentação

Sempre verificar se a alteração exige atualização de:

README

docs/

ADR

Roadmap

Changelog

AI Context

Não atualizar documentação apenas quando houver absoluta certeza de que nenhuma informação ficou desatualizada.

---

# 5. Quality Gates

Antes de qualquer Commit, a IA deve validar:

✓ Projeto compila

✓ Lint sem erros

✓ Build executa

✓ Sem erros conhecidos relacionados à tarefa

✓ Sem TODOs criados para esconder problemas

✓ Sem código comentado desnecessário

✓ Sem arquivos temporários

✓ Sem console.log esquecidos

✓ Sem imports não utilizados

✓ Sem warnings relevantes

✓ Documentação atualizada

✓ Git Status conhecido

Caso qualquer item falhe:

**Implementation Complete** ainda não foi alcançado (Quality Gates falharam).  
Não avançar para Commit/Push/PR até corrigir, salvo decisão humana explícita em Hotfix autorizado.

---

# 6. Commit

Os commits devem ser pequenos.

Objetivos.

Descritivos.

Nunca gigantes.

Formato recomendado:

```
feat(admin): implement platform admin guard

fix(login): remove legacy tenant authentication

docs(auth): update authentication flow

refactor(repository): simplify school repository
```

Evitar commits como:

```
update

ajustes

teste

fix

coisas

final

versão nova
```

---

# 7. Push

Após o commit:

```
git push
```

A IA deve confirmar:

- push realizado com sucesso;
- branch remota criada.

---

# 8. Pull Request

Todo Merge deve ocorrer através de Pull Request.

A descrição do PR deve conter:

## Objetivo

Resumo da alteração.

## Alterações

Lista objetiva.

## Impactos

Possíveis impactos conhecidos.

## Testes realizados

Como a funcionalidade foi validada.

## Relacionamento

```
Closes #24
```

Sempre utilizar:

```
Closes #N
```

Nunca utilizar apenas referências soltas.

---

# 9. Merge

O Merge somente pode ocorrer quando:

✓ Build aprovado

✓ Lint aprovado

✓ Revisão concluída

✓ Nenhum erro conhecido

✓ Documentação atualizada

✓ PR aprovado

Caso contrário:

Não realizar Merge.

---

# 10. Exclusão da Branch

Após Merge:

Excluir Branch local.

Excluir Branch remota.

Nunca manter branches antigas abertas sem necessidade.

---

# 11. Encerramento da Issue

Uma Issue somente pode ser encerrada quando os critérios de **Delivery Complete** aplicáveis forem atendidos, tipicamente:

✓ Merge realizado

✓ Branch removida

✓ PR encerrado

✓ Alterações disponíveis na branch principal

✓ Nenhum erro conhecido relacionado à Issue

Caso exista qualquer erro ainda pendente:

A Issue permanece aberta.

Encerrar Issue ≠ Release Complete.

---

# Responsabilidade da IA

A IA deve assumir que o desenvolvedor pode esquecer qualquer etapa.

Portanto, é responsabilidade da IA:

- lembrar cada etapa;
- validar cada etapa;
- impedir Delivery Complete incorreto;
- impedir merges prematuros;
- impedir commits incompletos;
- impedir fechamento de Issues antes da hora;
- declarar Implementation Complete quando a qualidade/escopo estiver pronto, mesmo se Merge ainda depender de aprovação humana (listando Delivery pending).

O desenvolvedor nunca deve precisar lembrar do fluxo do Git.

---

# Fluxo resumido

```
Issue

↓

Branch

↓

Implementação

↓

Documentação

↓

Quality Gates

↓

Commit

↓

Push

↓

Pull Request

↓

Merge

↓

Delete Branch

↓

Close Issue
```

Este fluxo é obrigatório para **Delivery Complete** em projetos que seguem o AADS.  
Não redefine sozinho Implementation Complete nem Release Complete.
