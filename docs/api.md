# API — Smart Exit School

## Situação atual

**Não há API REST própria.** A aplicação é uma SPA que acessa dados via:

1. **Supabase PostgREST + Auth + RPC** — catálogo de escolas (`public.schools`) e Platform Admin (`is_platform_admin()`)
2. **localStorage** — via services: sessão escolar, gates, calls, tema

Não há GraphQL, WebSocket server-side ou endpoints HTTP customizados.

Detalhes de fluxo: [fluxos.md](fluxos.md).

---

## Rotas HTTP (SPA — React Router)

Estas são rotas de **navegação frontend**, não endpoints de API.

| Rota | Método* | Componente | Autenticação | Descrição |
|------|---------|--------------|--------------|-----------|
| `/` | GET | Redirect | Não | Redireciona para `/login` |
| `/login` | GET | `Login` | Não | Tela de autenticação |
| `/admin/institutions` | GET | `InstitutionsManager` | Platform Admin (Auth + RPC + guard) | Gestão de instituições |
| `/painel` | GET | `InstitutionPanel` | Sessão operacional local (Auth Tenant pendente) | Painel da instituição |
| `/tv` | GET | `TvDisplay` | Sessão (para `schoolId`) | Telão de chamadas |

\* Em SPA, todas as rotas respondem com o mesmo `index.html`; o "método" efetivo é sempre GET no servidor estático.

---

## Integração Supabase (fonte de verdade — escolas / Platform Admin)

| Operação | Camada | Destino |
|----------|--------|---------|
| Listar / CRUD escolas | `schoolService` → `schoolRepository` | `public.schools` |
| Login Platform Admin | `supabase.auth.signInWithPassword` | Auth |
| Checagem admin | `platformAdminService` → RPC | `public.is_platform_admin()` |
| Sync Auth → profile | Trigger Migration 0010 | `auth.users` → `profiles` |

---

## API Key (funcionalidade de UI — sem backend)

### Geração

**Local:** `InstitutionPanel.handleGenerateApiKey()`  
**Plano requerido:** Diamond  
**Formato:** `sk_live_{random}{random}` (base36)

### Uso

**Não identificado.** A chave é:

- Gerada e salva no objeto de sessão da escola
- Exibida no campo readonly em Configurações
- **Nunca enviada** a nenhum servidor
- **Nunca validada** em nenhuma requisição

A UI menciona "APIs, webhooks e idiomas secundários" para Diamond, mas **nenhum endpoint foi definido no código**.

---

## Contratos localStorage (operação do painel / telão)

Catálogo de escolas: exclusivamente Supabase (`public.schools`). Chaves localStorage restantes:

### PUT/GET `@SmartExit:loggedSchool`

**Body:** Objeto escola (sessão do operador). Persistido após login tenant bem-sucedido.

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

### GET/PUT `@SmartExit:darkMode`

Preferência de tema (`"true"` / `"false"`).

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
| 2000ms | Relê `@SmartExit:called:{schoolId}` |

---

## Autenticação necessária

| Operação | Requisito |
|----------|-----------|
| Login Platform Admin | Supabase Auth + `platform_admins` + RPC `is_platform_admin()` |
| Login operador da instituição | **Não implementado** (ADR-029) |
| Painel CRUD | `@SmartExit:loggedSchool` presente |
| Telão | `@SmartExit:loggedSchool` (para `schoolId`) |
| Admin panel | Sessão Auth + Platform Admin (guard) |

---

## Exemplos de uso (desenvolvimento local)

### Inspecionar chaves Smart Exit

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('@SmartExit'))
  .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))))
```

### Simular chamada de aluno (sessão já autenticada)

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

Provisionamento Platform Admin: ver [instalacao.md](instalacao.md) e [autenticacao.md](autenticacao.md).

---

## API futura (inferida da UI — não implementada)

| Capacidade mencionada | Plano | Status |
|-----------------------|-------|--------|
| Webhooks | Diamond | Não implementado |
| REST API com API Key | Diamond | Não implementado |
| Geolocalização responsáveis | Diamond | Não implementado |
| Integração vans/frotas | Diamond | Não implementado |
