# API — Smart Exit School

## Situação atual

**Não há API REST própria.** A aplicação expõe rotas SPA e acessa dados via:

1. **localStorage** — via services (maioria das operações)
2. **Supabase PostgREST** — CRUD do catálogo `schools` via `schoolService`

Não há GraphQL, WebSocket server-side ou endpoints HTTP customizados.

---

## Rotas HTTP (SPA — React Router)

Estas são rotas de **navegação frontend**, não endpoints de API.

| Rota | Método* | Componente | Autenticação | Descrição |
|------|---------|--------------|--------------|-----------|
| `/` | GET | Redirect | Não | Redireciona para `/login` |
| `/login` | GET | `Login` | Não | Tela de autenticação |
| `/admin/institutions` | GET | `InstitutionsManager` | **Não enforced** | Painel Super Admin |
| `/painel` | GET | `InstitutionPanel` | Sessão localStorage | Painel da escola |
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

## Contratos de dados (localStorage como "API interna")

Estes contratos descrevem a interface de persistência usada pelos componentes.

### Catálogo `schools` (Supabase)

`schoolService.getAllSchools()` / `saveSchool()` / `deleteSchool()` usam `public.schools`. A chave `@SmartExit:schools` **foi removida**.

`saveSchool` normaliza `name` com `trim`. Create sem nome utilizável, ou update que envia nome vazio/só espaços, retorna `null` e **não** grava no Supabase.

### PUT `@SmartExit:loggedSchool`

**Body:** Objeto de sessão da escola  
**Efeito colateral:** nenhum no catálogo PostgreSQL — sessão local apenas

### GET/PUT `@SmartExit:called:{schoolId}`

**Retorno/Body:** `CalledStudent[]`

```json
[
  {
    "id": 1700000000000,
    "name": "Maria Silva",
    "grade": "2º A",
    "defaultExit": "Portão Principal",
    "time": "14:35",
    "exitGate": "Portão Sul"
  }
]
```

### GET/PUT `@SmartExit:gates:{schoolId}`

**Retorno/Body:** `Gate[]`

```json
[
  {
    "id": "1700000000000",
    "name": "Portão Principal",
    "time": "17:30",
    "defaultClasses": ["1º Ano A", "1º Ano B"]
  }
]
```

---

## Eventos cross-tab (Telão)

### `storage` event

| Propriedade | Valor |
|-------------|-------|
| Origem | Mesma origem (protocol + host + port) |
| Keys monitoradas | `@SmartExit:called:{id}`, `@SmartExit:loggedSchool`, `@SmartExit:darkMode` |
| Ação | Re-fetch dos dados afetados |

### Polling fallback

| Intervalo | Ação |
|-----------|------|
| 2000ms | `fetchCalls()` — relê `@SmartExit:called:{schoolId}` |

---

## Autenticação necessária

| Operação | Requisito |
|----------|-----------|
| Login Super Admin | E-mail/senha hardcoded |
| Login Escola | `authService.login()` via `schoolService.getAllSchools()` (ainda espera `email`/`password` que o schema não armazena) |
| Painel CRUD | `@SmartExit:loggedSchool` presente |
| Telão | `@SmartExit:loggedSchool` (para obter `schoolId`) |
| Admin panel | **Nenhum** |

---

## Exemplos de uso (desenvolvimento local)

### Autenticar como escola (via console)

```javascript
// O catálogo não está mais em localStorage. Use o Studio/Supabase ou a sessão já gravada.
const school = JSON.parse(localStorage.getItem('@SmartExit:loggedSchool'))
window.location.href = '/painel'
```

### Simular chamada de aluno

```javascript
const school = JSON.parse(localStorage.getItem('@SmartExit:loggedSchool'))
const calls = [{
  id: 1,
  name: 'João Teste',
  grade: '3º A',
  defaultExit: 'Portão Principal',
  time: '15:00',
  exitGate: 'Portão Principal'
}]
localStorage.setItem(`@SmartExit:called:${school.id}`, JSON.stringify(calls))
```

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
