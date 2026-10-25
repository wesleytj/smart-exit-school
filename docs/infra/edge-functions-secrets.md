# Edge Functions Secrets & SMTP Configuration

**Projeto:** Smart Exit School (SES)  
**Escopo:** Ciclo B / Provisionamento de Membros  
**Edge Functions:** `invite-member`, `accept-invite`, `impersonate-user`, `end-impersonation`  

---

## 1. Secrets Requeridas para Convite de Membros

Para que o envio de e-mails transacionais de convite funcione em ambiente Supabase (homologação e produção), configure as seguintes variáveis no projeto:

| Variável / Secret | Valor Padrão / Exemplo | Descrição |
|---|---|---|
| `BREVO_SMTP_HOST` | `smtp-relay.brevo.com` | Host oficial do relay Brevo |
| `BREVO_SMTP_PORT` | `587` | Porta STARTTLS padrão |
| `BREVO_SMTP_USER` | `<SMTP_USER>` | Identificador de login gerado no Brevo |
| `BREVO_SMTP_PASS` | `<SMTP_KEY>` | Senha/chave de API SMTP gerada no Brevo |
| `BREVO_FROM` | `Smart Exit School <remetente@verificado>` | Nome e endereço verificado no Brevo |
| `SITE_URL` | `https://smart-exit-school.vercel.app` | URL base do frontend para montar o link `/accept-invite?token=...` |

---

## 2. Como Configurar no Supabase CLI

```bash
# Definir secrets no Supabase Cloud
npx supabase secrets set \
  BREVO_SMTP_HOST="smtp-relay.brevo.com" \
  BREVO_SMTP_PORT="587" \
  BREVO_SMTP_USER="<SEU_LOGIN_BREVO>" \
  BREVO_SMTP_PASS="<SUA_CHAVE_BREVO>" \
  BREVO_FROM="Smart Exit School <<SEU_EMAIL_VERIFICADO>>" \
  SITE_URL="https://smart-exit-school.vercel.app"
```

---

## 3. Deploy das Funções de Convite

As funções são implantadas com a flag `--no-verify-jwt` para gerenciar autenticação híbrida diretamente no código:

```bash
npx supabase functions deploy invite-member --no-verify-jwt
npx supabase functions deploy accept-invite --no-verify-jwt
```

---

## 4. Secret Obrigatória em Produção — Impersonation

- `SUPABASE_JWT_SECRET` e/ou `JWT_SECRET` devem estar configuradas nas Edge Functions de impersonation (`impersonate-user` e `end-impersonation`).
- O valor é o JWT secret real do projeto Supabase Cloud (obtido via Management API `projects/<ref>/postgrest` ou Dashboard → Project Settings → API → JWT Settings).
- **Nunca** deixe a Edge Function cair no fallback de desenvolvimento local (`super-secret-jwt-token-with-at-least-32-characters-long`) em produção.
- Comando para configurar:
  ```bash
  npx supabase secrets set JWT_SECRET="<JWT_SECRET_DO_PROJETO>" --project-ref yantfnekslrzhussewdh
  ```
- Deploy das funções pós-configuração de secret:
  ```bash
  npx supabase functions deploy impersonate-user --no-verify-jwt --project-ref yantfnekslrzhussewdh
  npx supabase functions deploy end-impersonation --no-verify-jwt --project-ref yantfnekslrzhussewdh
  ```

