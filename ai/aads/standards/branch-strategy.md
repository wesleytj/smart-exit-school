# Branch Strategy

> Estratégia oficial de branches utilizada pelos projetos que seguem o AADS.

Este documento define como as branches devem ser criadas, utilizadas e encerradas.

Seu objetivo é manter um histórico limpo, previsível e fácil de navegar.

---

# Filosofia

Cada branch representa uma única responsabilidade.

Uma branch nunca deve misturar múltiplas funcionalidades não relacionadas.

Branches existem para isolar mudanças.

---

# Branch principal

A branch principal do projeto é:

```
main
```

Ela representa sempre um estado estável.

A branch `main` deve permanecer:

- compilando;
- documentada;
- funcional;
- pronta para produção.

Nunca desenvolver diretamente nela.

---

# Branches permitidas

## Feature

Utilizada para novas funcionalidades.

Formato:

```
feature/<issue>-<descricao>
```

Exemplos

```
feature/24-platform-admin

feature/31-auth-tenant

feature/52-tv-panel
```

---

## Fix

Correções comuns.

Formato

```
fix/<issue>-<descricao>
```

Exemplos

```
fix/38-login-loop

fix/71-student-filter
```

---

## Hotfix

Correções críticas.

Utilizadas quando um problema precisa ser corrigido imediatamente.

Formato

```
hotfix/<issue>-<descricao>
```

Exemplo

```
hotfix/102-production-crash
```

---

## Docs

Alterações exclusivamente de documentação.

Formato

```
docs/<issue>-<descricao>
```

Exemplo

```
docs/58-update-readme
```

---

## Refactor

Mudanças estruturais sem alteração de comportamento.

Formato

```
refactor/<issue>-<descricao>
```

Exemplo

```
refactor/64-school-service
```

---

## Chore

Alterações técnicas que não modificam regras de negócio.

Exemplos:

- dependências
- configuração
- scripts
- CI
- tooling

Formato

```
chore/<issue>-<descricao>
```

---

# Convenções

Toda branch deve:

- usar letras minúsculas;
- utilizar hífen;
- conter o número da Issue;
- possuir descrição curta.

Correto

```
feature/24-platform-admin
```

Errado

```
NovaBranch

featureNova

Issue24

teste

feature/admin
```

---

# Ciclo de vida

Toda branch deve seguir o fluxo:

```
Issue

↓

Criar Branch

↓

Implementação

↓

Commit

↓

Push

↓

Pull Request

↓

Merge

↓

Excluir Branch
```

---

# Branches longas

Evitar branches abertas por muitos dias.

Se uma implementação for grande:

- dividir em múltiplas Issues;
- dividir em múltiplas PRs;
- integrar continuamente.

Branches pequenas são mais fáceis de revisar.

---

# Atualização da branch

Sempre sincronizar com a `main` antes de abrir um Pull Request.

Exemplo

```
git checkout main

git pull

git checkout feature/24-platform-admin

git merge main
```

Ou utilizar Rebase, conforme política do projeto.

---

# Estratégia de Merge

O padrão oficial do AADS é:

**Squash and Merge**

Objetivos:

- manter histórico limpo;
- evitar dezenas de commits intermediários;
- facilitar auditoria.

Cada PR gera um único commit na `main`.

---

# Nome do Pull Request

Formato recomendado

```
feat(admin): platform authentication

fix(login): remove legacy authentication

docs(readme): update installation

refactor(repository): simplify school service
```

---

# Exclusão da branch

Após Merge:

Excluir a branch remota.

Excluir a branch local.

Branches concluídas não devem permanecer abertas.

---

# Branch abandonada

Caso uma branch deixe de ser utilizada:

- fechar a Issue correspondente;
- registrar o motivo;
- excluir a branch.

Nunca deixar branches órfãs.

---

# Responsabilidade da IA

A IA deve verificar:

✓ Existe uma Issue?

✓ Existe uma branch correta?

✓ O nome segue o padrão?

✓ A branch corresponde apenas àquela Issue?

✓ Existe Pull Request?

✓ O Merge foi realizado?

✓ A branch foi removida?

Caso alguma resposta seja negativa, **Delivery Complete** ainda não foi alcançado (e Implementation Complete só se os demais critérios técnicos estiverem ok).

---

# Resumo

```
main

│

├── feature/24-platform-admin

├── feature/31-auth-tenant

├── fix/52-login

├── docs/61-readme

├── refactor/71-school-service

└── hotfix/102-production
```

Uma branch.

Uma responsabilidade.

Uma Issue.

Um Pull Request.

Um Merge.

Depois disso, a branch deve ser removida.