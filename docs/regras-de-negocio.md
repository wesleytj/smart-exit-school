# Regras de Negócio — Smart Exit School

Documentação derivada exclusivamente do comportamento implementado no código-fonte.

---

## 1. Modelo de negócio SaaS

### 1.1 Multi-instituição

- Uma instância da aplicação serve múltiplas escolas (instituições)
- Catálogo de instituições: **Supabase** `public.schools` (única fonte de verdade)
- Isolamento de schema/RLS por `school_id` / membership; operação do painel ainda usa chaves localStorage por `school.id` para gates/calls/sessão
- Login de operador da instituição: ADR-029 (pendente)

### 1.2 Planos de assinatura

| Plano | Identificador | Recursos |
|-------|---------------|----------|
| Basic | `"Basic"` | Monitor, alunos, turmas, portões, import CSV |
| Premium | `"Premium"` | Basic + whitelabel, dark mode, relatórios (placeholder) |
| Diamond | `"Diamond"` | Premium + API key, idioma, fleet (placeholder) |
| Trial | `"Trial (Teste 14 dias)"` | Selecionável no admin; **sem lógica específica no painel** |

Plano legado `"Pro"` é automaticamente convertido para `"Basic"`.

### 1.3 Status da instituição

- Valores: `"Ativo"` | `"Inativo"`
- Platform Admin pode suspender/reativar via toggle
- **Regra não implementada:** login não verifica `status === "Inativo"` — escola inativa ainda consegue autenticar se credenciais forem válidas

---

## 2. Autenticação e sessão

### 2.1 Platform Admin

- Login via Supabase Auth (`signInWithPassword`)
- Checagem via RPC `is_platform_admin()` (`platformAdminService` / `PlatformAdminProvider`)
- Redireciona para `/admin/institutions`
- Sessão Auth gerenciada pelo cliente Supabase
- Rota admin protegida pelo guard em `InstitutionsManager` (`usePlatformAdmin`)
- Bootstrap opcional: Migration 0009 promove profile com e-mail `admin@alltech.com` quando Auth + profile já existem

### 2.2 Operador da instituição (Auth Tenant)

- **Não implementado** (ADR-029)
- `Login.jsx` não autentica operadores escolares
- `authService` apenas lê/grava sessão operacional `@SmartExit:loggedSchool` (painel/TV)
- `public.schools` não possui `email`/`password` (ADR-005)

### 2.3 Painel institucional

- Se `@SmartExit:loggedSchool` ausente → redirect `/login`
- Componente retorna `null` enquanto `school` não carrega

---

## 3. Fluxo de saída de alunos

### 3.1 Pré-requisitos

Para chamar um aluno:

1. Aluno deve existir em `school.studentsList`
2. Deve haver ao menos um portão em `school.exits` (fallback: `"Portão Principal"`)
3. Aluno não pode já estar na fila `calledStudents` (mesmo `id`)

### 3.2 Seleção de portão na chamada

Ordem de precedência para `exitGate`:

```
callExits[student.id]  →  student.defaultExit  →  school.exits[0]  →  "Portão Principal"
```

Operador pode alterar portão via `<select>` antes de chamar.

### 3.3 Registro da chamada

Ao chamar:

- Adiciona objeto com `time` (hora:minuto locale) e `exitGate`
- Insere no **início** da fila (LIFO para exibição — mais recente primeiro)
- Persiste em `@SmartExit:called:{schoolId}`

### 3.4 Confirmação de saída

- Botão "Confirmar Saída" remove aluno da fila
- **Não registra histórico** permanente de saídas confirmadas
- **Não notifica** responsáveis

### 3.5 Telão (TV)

- Exibe `calledStudents[0]` como "Chamada Atual"
- Demais itens como "Chamadas Recentes"
- Sincroniza com painel via `storage` event + polling 2s
- Clique no header alterna fullscreen

---

## 4. Gestão de turmas

### 4.1 Cadastro

- Campos obrigatórios: `name`
- Campo opcional: `defaultExit` (selecionado de `school.exits`)
- ID gerado com `Date.now()`

### 4.2 Edição

- Renomear turma atualiza `grade` de todos os alunos vinculados
- Alterar `defaultExit` da turma propaga para alunos daquela turma

### 4.3 Exclusão

- Remove turma da lista
- **Não remove** alunos vinculados — alunos mantêm `grade` com nome da turma excluída

### 4.4 Bulk edit (código presente, UI ausente)

Funções `handleToggleClass`, `handleApplyBulkClassChanges` existem mas **não há interface** na aba Turmas para seleção em massa.

---

## 5. Gestão de alunos

### 5.1 Cadastro

- Obrigatório: `name`, `grade` (turma existente)
- `defaultExit`: se vazio, usa `school.exits[0]` ou `"Portão Principal"`
- Se turma selecionada tem `defaultExit`, preenche automaticamente

### 5.2 Edição em massa

- Seleção via checkbox
- Pode alterar turma e/ou saída em bulk
- Se apenas turma alterada (sem saída), herda `defaultExit` da nova turma

### 5.3 Contador

- Campo `school.students` atualizado com `studentsList.length`

### 5.4 Duplicatas

- CRUD manual: **permite** nomes duplicados
- Importação CSV: **bloqueia** duplicata por nome exato

---

## 6. Gestão de portões

### 6.1 Dois sistemas coexistem

| Sistema | Armazenamento | Uso no monitor |
|---------|---------------|----------------|
| `school.exits` | Dentro do objeto School | **Sim** — dropdown e filtros |
| `gatesList` | `@SmartExit:gates:{id}` | **Não diretamente** — gestão separada |

### 6.2 Portões avançados (gatesList)

- Campos: `name`, `time` (obrigatórios), `defaultClasses` (opcional)
- Checkbox "Tornar padrão de turmas específicas":
  - Atualiza `defaultExit` das turmas selecionadas
  - Atualiza `defaultExit` dos alunos cuja `grade` está nas turmas selecionadas
- Exclusão remove apenas da `gatesList`, não de `school.exits`

### 6.3 Portões legados (school.exits)

- Adição via `handleAddExit` — **UI não identificada na aba Portões atual**
- Remoção via `handleRemoveExit` — **UI não identificada**
- Escolas novas no Supabase **não** trazem `exits` no schema — dependem do modelo de sessão/UI local

---

## 7. Importação CSV

### 7.1 Formato

- Extensão: `.csv`
- Encoding: `windows-1252`
- Separadores: `;` ou `,`
- Colunas: `Nome`, `Turma` (header opcional — linha com "nome" ignorada)

### 7.2 Comportamento

- Turma inexistente → cria automaticamente com `defaultExit: school.exits[0] || "Portão Principal"`
- Aluno duplicado (mesmo nome) → ignorado
- Exibe alert com contagem de alunos e turmas adicionados

---

## 8. Whitelabel e aparência

### 8.1 Plano Basic

- Logo fixo AllTech Solutions
- Cores fixas: primary `#f97316`, secondary `#3b82f6`
- Nome exibido: "AllTech Solutions" (ignora `school.name` no sidebar)
- Dark mode bloqueado

### 8.2 Planos Premium / Diamond

- Logo customizado (`customLogo` como Data URL)
- Cores customizáveis (`primaryColor`, `secondaryColor`)
- Nome da escola exibido no sidebar e telão
- Dark mode habilitado

### 8.3 Telão

- Logo customizado apenas se Premium/Diamond
- Avatar placeholder (ícone User) para Premium/Diamond

---

## 9. API Key (Diamond)

- Formato gerado: `sk_live_` + random base36
- Confirmação antes de regenerar (invalida anterior)
- **Chave não é usada** em nenhuma integração no código atual

---

## 10. Idioma

- Opções: Português (BR), English (US), Español (ES)
- Valor salvo em `school.language`
- **UI permanece em português** — tradução não implementada

---

## 11. Reset de fábrica

- Disponível em Configurações → Zona de Perigo
- `localStorage.clear()` — apaga **dados locais** do domínio (sessão, gates, calls, tema)
- Recarrega página
- **Não** recria catálogo de instituições (permanece no Supabase)

---

## 12. Regras de segurança (estado atual)

| Regra | Implementada? |
|-------|---------------|
| Senhas hasheadas (Platform Admin) | **Sim** — Supabase Auth |
| Login operador da instituição | **Não** — ADR-029 |
| HTTPS enforcement | N/A (client-side) |
| Route guards | `/painel` (sessão local) + `/admin/institutions` (Platform Admin) |
| Validação status Inativo no login | **Não** |
| Rate limiting | **Não** |
| CSRF protection | N/A |
| Sanitização XSS em inputs | **Não identificada** |
| Controle de sessão expirável | Auth Platform: sessão Supabase; painel LS: **Não** |

---

## 13. Regras de permissões por plano

Ver [permissoes.md](permissoes.md) para matriz completa.

Resumo:

- **Basic:** relatórios e fleet bloqueados; whitelabel bloqueado; dark mode bloqueado
- **Premium:** whitelabel, dark mode, relatórios (placeholder desbloqueado)
- **Diamond:** fleet desbloqueado (placeholder); API e idioma desbloqueados

Itens bloqueados exibem ícone `Lock` no menu mas **ainda são clicáveis** — mostram tela de upgrade ou placeholder.

---

## Pontos que precisam de validação

- Comportamento esperado para plano Trial após 14 dias
- Se escola Inativa deve ser bloqueada no login
- Se exclusão de turma deve desvincular ou excluir alunos
- Unificação entre `exits` e `gatesList`
- Se histórico de saídas confirmadas deve ser persistido
