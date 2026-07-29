# Troubleshooting — Smart Exit School

Problemas conhecidos alinhados ao código atual.

---

## Autenticação e sessão

### Platform Admin não entra / redireciona para login

**Causas:**

1. Usuário inexistente no Supabase Auth
2. Profile não sincronizado (trigger Migration 0010)
3. Sem linha em `public.platform_admins`
4. `VITE_SUPABASE_*` incorretas ou Supabase local parado

**Soluções:** ver [instalacao.md](instalacao.md) e [autenticacao.md](autenticacao.md).

---

### Conta Auth válida sem acesso admin

**Sintoma:** mensagem de permissão após login.

**Causa:** usuário autenticado sem `platform_admins`.

**Solução:** inserir o `profile_id` em `public.platform_admins`.

---

### Não consigo entrar no painel da instituição

**Comportamento esperado:** Auth Tenant ainda não existe (ADR-029). `/login` autentica somente Platform Admin.

O painel exige `@SmartExit:loggedSchool`. Sem Auth Tenant, não há fluxo de produto para criar essa sessão.

---

### Platform Admin não acessa o painel da escola

**Esperado:** destino é `/admin/institutions`. Impersonação ainda não implementada (ADR-028).

---

## Telão (/tv)

### Telão mostra "Carregando..." indefinidamente

**Causa:** `@SmartExit:loggedSchool` ausente.

**Solução:** sessão operacional da instituição na mesma origem; recarregar `/tv`.

---

### Chamadas não aparecem no telão

**Causas:** origens diferentes (`localhost` vs `127.0.0.1`); evento `storage` na mesma aba; `schoolId` divergente.

**Soluções:** mesma URL base; aguardar polling (2s); inspecionar `@SmartExit:called:{id}`.

---

## Dados e persistência

### Instituições não listam no admin

**Causas:** sem sessão Platform Admin; RLS; migrations não aplicadas.

**Solução:** `supabase db reset`, provisionar Platform Admin, conferir Studio.

---

### Reset de fábrica apagou sessão/gates/calls

**Esperado:** limpa localStorage; **não** apaga `public.schools`.

---

### Importação CSV / logo / portões

Mesmas causas operacionais do painel (formato CSV, plano Basic bloqueando whitelabel, `school.exits` ≠ `gatesList`). Ver roadmap.

---

## Build

```bash
npm install
npm run lint
npm run build
```

404 em produção: configurar SPA fallback para `index.html` ([deploy.md](deploy.md)).

---

## Segurança

- Platform Admin apenas via Supabase Auth
- Chave anon (`VITE_SUPABASE_ANON_KEY`) é pública; service role nunca no frontend
