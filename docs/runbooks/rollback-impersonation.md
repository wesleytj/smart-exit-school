# Runbook: Rollback Atômico de Impersonation (Frontend & Edge Functions)

**Objetivo:** Estabelecer o procedimento operacional padrão para reverter de forma segura e consistente alterações no módulo de personificação de suporte (*impersonation*).  
**Princípio Cardinal:** **Nunca reverta meio stack.** Frontend e Edge Function devem ser sincronizados e revertidos como uma unidade atômica para evitar discrepâncias contratuais de sessão.

---

## 1. Princípios de Compatibilidade e Fallback

### 1.1 O Papel do Fallback em `impersonationService.js`
No cliente web ([src/services/impersonationService.js](file:///c:/github_projects/smart-exit-school/src/services/impersonationService.js)), a inicialização da sessão de suporte adota a resolução de token:
```javascript
const resolvedRefreshToken = refresh_token || token;

return await supabase.auth.setSession({
  access_token: token,
  refresh_token: resolvedRefreshToken
});
```
- **Proteção:** Se o frontend for acionado contra uma versão legada da Edge Function (v4 ou anterior) que emitia apenas `token` / `access_token` sem `refresh_token`, o cliente não quebra com erro fatal do GoTrue (`Auth session missing!`). Ele assume o `access_token` como valor sentinela temporário.
- **Limitação Estrutural:** O fallback protege apenas o carregamento inicial da sessão. Caso o GoTrue tente renovar o token em background, a renovação falhará por falta de paridade de assinatura no endpoint `/auth/v1/token?grant_type=refresh_token`. Por isso, a sessão de suporte é configurada com `supabase.auth.stopAutoRefresh()` e TTL estrito de 45 minutos.

---

## 2. Procedimento Operacional de Rollback

Caso uma versão recente da Edge Function ou do frontend precise ser desfeita em produção:

### Etapa 1: Reverter a Edge Function no Supabase Cloud
1. Localize o commit ou checkout da versão estável anterior de `supabase/functions/impersonate-user/index.ts`:
   ```bash
   git checkout <commit-estavel> -- supabase/functions/impersonate-user/index.ts
   ```
2. Realize o deploy explícito para o projeto de produção (`yantfnekslrzhussewdh`):
   ```bash
   npx supabase functions deploy impersonate-user --project-ref yantfnekslrzhussewdh
   ```
3. Se a função `end-impersonation` também tiver sido modificada:
   ```bash
   npx supabase functions deploy end-impersonation --project-ref yantfnekslrzhussewdh
   ```

### Etapa 2: Reverter o Frontend da Aplicação
1. Reverter o commit correspondente na branch de deploy ou realizar checkout da tag estável anterior:
   ```bash
   git revert <commit-do-bug> --no-edit
   ```
2. Validar que os quality gates locais permanecem íntegros:
   ```bash
   npm run lint
   npm run build
   npm run test:unit
   npm run test:integration
   ```
3. Realizar o build e publicação da nova release do frontend via pipeline de CI/CD.

### Etapa 3: Validação de Deploy Parity Pós-Rollback
1. Inspecionar o catálogo de funções ativas:
   ```bash
   npx supabase functions list --project-ref yantfnekslrzhussewdh
   ```
   - Confirmar que `impersonate-user` e `end-impersonation` estão no status `ACTIVE`.
   - Comparar o hash ou fazer download pontual para verificar a ausência de divergências locais:
     ```bash
     npx supabase functions download impersonate-user --project-ref yantfnekslrzhussewdh --use-api
     git diff supabase/functions/impersonate-user/index.ts
     ```
2. Verificar a sincronização de migrations:
   ```bash
   npx supabase migration list --linked
   ```
   - O schema do banco de dados não sofre rollback destrutivo (as migrations versionadas continuam sincronizadas 27/27).

---

## 3. Verificação Funcional Pós-Rollback

Após restabelecer a versão anterior:
1. Executar a suíte de testes de integração:
   ```bash
   npm run test:integration
   ```
2. Executar o cenário ponta a ponta E2E-08 no ambiente de testes:
   ```bash
   npm run test:e2e -- tests/e2e/08-platform-impersonation.spec.ts
   ```
3. Testar manualmente via interface administrativa:
   - Acessar `/admin/institutions` com perfil Platform Admin.
   - Acionar o botão "Suporte" em uma instituição.
   - Confirmar que o painel da instituição carrega normalmente com o banner superior de impersonation.
   - Clicar em "Encerrar Suporte" e validar o retorno à lista de instituições sem perda de sessão.
