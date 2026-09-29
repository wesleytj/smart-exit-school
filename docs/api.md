# API — Smart Exit School

## Situação atual

**Não há API REST própria.** A aplicação expõe rotas SPA e acessa dados via:

1. **Supabase PostgREST** — catálogo `schools`, alunos, portões e a fila `pickup_events`
2. **localStorage** — tema e cache operacional (`@SmartExit:schoolOps:`), que não é a fila de saída

Não há GraphQL, WebSocket server-side ou endpoints HTTP customizados.

---

## Rotas HTTP (SPA — React Router)

Estas são rotas de **navegação frontend**, não endpoints de API.

| Rota | Método* | Componente | Autenticação | Descrição |
|------|---------|--------------|--------------|-----------|
| `/` | GET | Redirect | Não | Redireciona para `/login` |
| `/login` | GET | `Login` | Não | Tela de autenticação |
| `/admin/institutions` | GET | `InstitutionsManager` | **Não enforced** | Painel Super Admin |
| `/painel` | GET | `InstitutionPanel` | Membership ativa | Painel da escola |
| `/tv` | GET | `TvDisplay` | **Não enforced** | Telão de chamadas |

\* Em SPA, todas as rotas respondem com o mesmo `index.html`; o "método" efetivo é sempre GET no servidor estático.

---

## API Key (funcionalidade mock)

### Geração

**Local:** `InstitutionPanel.handleGenerateApiKey()`  
**Plano requerido:** Diamond  
**Formato:** `sk_live_{random}{random}` (base36)

### Uso

**Não identificado.** A chave é:

- Gerada e salva em `school.apiKey`
- Exibida no campo readonly em Configurações
- **Nunca enviada** a nenhum servidor
- **Nunca validada** em nenhuma requisição

### Endpoints esperados (não implementados)

A UI menciona "APIs, webhooks e idiomas secundários" para Diamond, mas **nenhum endpoint foi definido no código**.

---

## Contratos de dados

Estes contratos descrevem a persistência usada pelos componentes. A fila de saída está na seção `public.pickup_events`, abaixo.

### Catálogo `schools` (Supabase)

`schoolService.getAllSchools()` / `saveSchool()` / `deleteSchool()` usam `public.schools`. A chave `@SmartExit:schools` **foi removida**.

`saveSchool` normaliza `name` com `trim`. Create sem nome utilizável, ou update que envia nome vazio/só espaços, retorna `null` e **não** grava no Supabase.

O nome é **único** em `public.schools` (`schools_name_unique`). `saveSchool` consulta o catálogo antes de persistir; se outra escola já usa o nome, retorna `null`. A constraint UNIQUE no Postgres impede duplicata em corrida. Unicidade de `slug` é independente.

No update, `saveSchool` persiste `plan` mesmo quando `name` não muda: só reescreve campos que de fato mudaram (após o adapter UI ↔ DB). O modal Super Admin envia `id`, `name` e `plan` na edição.

### `@SmartExit:loggedSchool`

Chave legada. Não é sessão, não autoriza acesso e não escolhe o tenant. A autoridade é Supabase Auth + membership ativa; ver [autenticacao.md](autenticacao.md).

### Fila de saída — `public.pickup_events`

`pickupService` / `pickupEventRepository` usam `public.pickup_events`. A chave `@SmartExit:called:{schoolId}` não é a fila.

| Operação | Efeito |
|----------|--------|
| `getActiveCallsBySchool(schoolId)` | `status = 'called'` da escola, `called_at` descendente, com nome do aluno, turma e portão |
| `callStudent({ schoolId, studentEnrollmentId, gateId })` | insere a linha `called` |
| `completeCall(eventId)` | atualiza para `completed` e preenche `completed_at` se a linha ainda está `called` |

O insert não envia nome, turma nem horário. Esses campos são lidos na consulta.

### `@SmartExit:gates:{schoolId}` — aposentada

A chave não é mais a fonte de verdade. Portões do painel e do Monitor vêm de `public.gates`. Ver [regras-de-negocio.md](regras-de-negocio.md).

---

## Releitura da fila (Telão e Monitor)

Não há Supabase Realtime nesta fase. Monitor e TV chamam `getActiveCallsBySchool` ao abrir e a cada 5 segundos (`ACTIVE_CALL_POLL_MS`), enquanto a tela estiver montada.

O listener de `storage` da TV observa só `@SmartExit:darkMode` para o tema.

---

## Autenticação necessária

| Operação | Requisito |
|----------|-----------|
| Login Platform Admin | Supabase Auth + `is_platform_admin()` → `/admin/institutions` |
| Login escola | Supabase Auth + membership ativa em `school_members` |
| Painel | Contexto de tenant resolvido pela membership; `localStorage` não autoriza |
| Telão | Sessão Supabase Auth com membership ativa. Sem sessão pronta, a fila não carrega |
| Zero memberships | Sem contexto de escola |

---

## Exemplos de uso (desenvolvimento local)

### Autenticar como escola

O acesso ao painel exige sessão Supabase Auth e membership ativa. Gravar `@SmartExit:loggedSchool` no console não autoriza `/painel`.

### Chamar um aluno

A chamada é uma linha em `public.pickup_events`, criada por um usuário autenticado com membership ativa. Gravar `@SmartExit:called:` no console não entra na fila.

### Inspecionar todos os dados

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('@SmartExit'))
  .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))))
```

---

## API futura (inferida da UI — não implementada)

| Capacidade mencionada | Plano | Status |
|-----------------------|-------|--------|
| Webhooks | Diamond | Não implementado |
| REST API com API Key | Diamond | Não implementado |
| Geolocalização responsáveis | Diamond | Não implementado |
| Integração vans/frotas | Diamond | Não implementado |

---

## Pontos que precisam de validação

- Especificação OpenAPI/Swagger para API futura
- Base URL e versionamento (`/v1/...`)
- Autenticação via Bearer token vs API Key header
- Webhooks: eventos (`student.called`, `student.dismissed`, etc.)
