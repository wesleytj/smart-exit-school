# Banco de Dados — Smart Exit School

## Situação atual

**Não há banco de dados relacional, NoSQL ou servidor de persistência identificado no projeto.**

Todos os dados são armazenados no **localStorage** do navegador, serializados como JSON. Os dados são:

- **Locais ao navegador/dispositivo** — não sincronizam entre máquinas
- **Voláteis** — podem ser apagados pelo usuário ou pelo reset de fábrica
- **Sem schema formal** — estrutura inferida do código

Este documento descreve o **modelo lógico de persistência** equivalente a um schema de banco.

---

## Diagrama ER (modelo lógico)

```mermaid
erDiagram
    SCHOOL ||--o{ CLASS : has
    SCHOOL ||--o{ STUDENT : has
    SCHOOL ||--o{ GATE : has
    SCHOOL ||--o{ CALLED_STUDENT : has
    CLASS ||--o{ STUDENT : contains

    SCHOOL {
        string id PK
        string name
        string email
        string password
        string plan
        string status
        number students
        array exits
        array classes
        array studentsList
        string primaryColor
        string secondaryColor
        string customLogo
        string language
        string apiKey
    }

    CLASS {
        number id PK
        string name
        string defaultExit
    }

    STUDENT {
        number id PK
        string name
        string grade
        string defaultExit
    }

    GATE {
        string id PK
        string name
        string time
        array defaultClasses
    }

    CALLED_STUDENT {
        number id PK
        string name
        string grade
        string defaultExit
        string time
        string exitGate
    }
```

---

## Chaves localStorage

### `@SmartExit:schools`

**Tipo:** `School[]` (array JSON)

**Descrição:** Registro master de todas as instituições. Fonte de verdade para login de escolas e painel Super Admin.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string \| number | Sim | Identificador único |
| `name` | string | Sim | Nome da instituição |
| `email` | string | Sim | E-mail de login |
| `password` | string | Sim | Senha em texto plano |
| `plan` | string | Sim | `Basic`, `Premium`, `Diamond`, `Trial` |
| `status` | string | Sim | `Ativo` ou `Inativo` |
| `students` | number | Não | Contador de alunos (derivado) |
| `exits` | string[] | Não | Lista de portões legados (nomes) |
| `classes` | Class[] | Não | Turmas cadastradas |
| `studentsList` | Student[] | Não | Alunos cadastrados |
| `primaryColor` | string | Não | Hex color (Premium/Diamond) |
| `secondaryColor` | string | Não | Hex color (Premium/Diamond) |
| `customLogo` | string | Não | Data URL base64 da imagem |
| `language` | string | Não | Ex: `Português (BR)` |
| `apiKey` | string | Não | Chave gerada localmente |

**Constraints identificadas:**

- Login compara `email` + `password` exatos
- Plano legado `"Pro"` é convertido para `"Basic"` no carregamento
- Escolas mock são inseridas se array vazio (ver MOCK_SCHOOLS)

**Índices:** Nenhum — busca linear com `.find()` e `.filter()`

---

### `@SmartExit:loggedSchool`

**Tipo:** `School` (objeto JSON)

**Descrição:** Cópia da escola autenticada na sessão atual. Atualizada a cada `saveSchoolData()`.

Mesma estrutura de `School` acima.

---

### `@SmartExit:gates:{schoolId}`

**Tipo:** `Gate[]`

**Descrição:** Portões avançados por instituição (separados de `school.exits`).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único (timestamp string) |
| `name` | string | Nome do portão |
| `time` | string | Horário padrão (`type="time"`, formato HH:mm) |
| `defaultClasses` | string[] | Nomes das turmas vinculadas como saída padrão |

**Relacionamentos:**

- Ao salvar portão como padrão, atualiza `defaultExit` em turmas e alunos correspondentes
- **Não sincroniza automaticamente** com `school.exits`

---

### `@SmartExit:called:{schoolId}`

**Tipo:** `CalledStudent[]`

**Descrição:** Fila de alunos chamados na sessão (monitor + telão).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | ID do aluno |
| `name` | string | Nome |
| `grade` | string | Turma |
| `defaultExit` | string | Saída padrão original |
| `time` | string | Horário da chamada (locale pt-BR) |
| `exitGate` | string | Portão efetivo da chamada |

**Regras:**

- Aluno não pode ser chamado duas vezes (verificação por `id`)
- Ordem: mais recente primeiro (`[newCall, ...calledStudents]`)
- Persiste entre recarregamentos da página

---

### `@SmartExit:darkMode`

**Tipo:** string (`"true"` | `"false"`)

**Descrição:** Preferência global de tema escuro. Aplicada via classe `dark` em `document.documentElement`.

---

### Chaves legadas (uso inconsistente)

| Chave | Tipo | Uso |
|-------|------|-----|
| `institutions` | `School[]` | Escrita parcial em `handleSaveColors()` — **não é fonte principal** |
| `currentUser` | `School` | Escrita parcial em `handleSaveColors()` — **não usada no login** |

---

## Entidades embutidas

### Class (Turma)

```json
{
  "id": 1700000000000,
  "name": "1º Ano B",
  "defaultExit": "Portão Principal"
}
```

**Migração legada:** Turmas antigas armazenadas como `string[]` são convertidas para objetos no carregamento.

### Student (Aluno)

```json
{
  "id": 1700000000000,
  "name": "João Pedro",
  "grade": "1º Ano B",
  "defaultExit": "Portão Principal"
}
```

### MOCK_SCHOOLS (seed de fábrica)

Três escolas pré-configuradas inseridas quando `@SmartExit:schools` está vazio:

| ID | Nome | E-mail | Plano | exits |
|----|------|--------|-------|-------|
| mock-basic | Teste - Basic | teste@basic.com | Basic | Portão Principal |
| mock-premium | Teste - Premium | teste@premium.com | Premium | Portão Principal, Portão Sul |
| mock-diamond | Teste - Diamond | teste@diamond.com | Diamond | Portão Principal, Portão VIP |

---

## Fluxos de dados

### Criação de instituição (Super Admin)

```
InstitutionsManager.handleSaveSchool()
  → institutions state
  → @SmartExit:schools
```

Campos iniciais: `status: "Ativo"`, `students: 0`, `exits: []`

### Login de escola

```
Login.handleLogin()
  → find em @SmartExit:schools
  → @SmartExit:loggedSchool
```

### Operação CRUD no painel

```
InstitutionPanel.saveSchoolData()
  → @SmartExit:loggedSchool
  → @SmartExit:schools (atualiza item por id)
```

### Chamada de aluno

```
handleCallStudent()
  → state calledStudents
  → @SmartExit:called:{schoolId}
  → TvDisplay (storage event / polling)
```

### Reset de fábrica

```
handleResetSystem()
  → localStorage.clear()
  → window.location.reload()
  → MOCK_SCHOOLS reinseridos no próximo load
```

---

## Índices e constraints

| Aspecto | Status |
|---------|--------|
| Índices de banco | N/A — localStorage |
| Unique constraints | Não enforced (duplicatas de nome de aluno evitadas apenas na importação CSV) |
| Foreign keys | Lógicas apenas (`student.grade` → `class.name`) |
| Transações | Não |
| Migrations | Conversão inline de `classes` string → object |

---

## Pontos que precisam de validação

- Se `school.exits` e `gatesList` devem convergir num modelo único de portão
- Se senhas devem permanecer em texto plano em produção
- Estratégia de backup/export dos dados localStorage
- Limite de tamanho do localStorage (~5MB) para logos base64 e listas grandes
