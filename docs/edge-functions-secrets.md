# Edge Functions Secrets & Configuration

Consulte a documentação canônica em [docs/infra/edge-functions-secrets.md](./infra/edge-functions-secrets.md).

## Secret Obrigatória em Produção — Impersonation

- `SUPABASE_JWT_SECRET` e/ou `JWT_SECRET` devem estar configuradas nas Edge Functions de impersonation (`impersonate-user` e `end-impersonation`).
- O valor é o JWT secret do projeto Supabase Cloud (Dashboard → Project Settings → API → JWT Settings).
- **Nunca** deixe a Edge Function cair no fallback de desenvolvimento local (`super-secret-jwt-token-with-at-least-32-characters-long`) em produção.
- Comando para configurar:
  ```bash
  npx supabase secrets set JWT_SECRET="<JWT_SECRET_DO_PROJETO>" --project-ref yantfnekslrzhussewdh
  ```
