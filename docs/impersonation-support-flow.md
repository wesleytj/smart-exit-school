# Guia de Operação: Fluxo de Suporte Técnico via Impersonation User-Level

Este documento orienta operadores, desenvolvedores e auditores sobre o funcionamento operacional e a arquitetura de segurança da funcionalidade de **Impersonation User-Level** ("Entrar como usuário") no Smart Exit School.

---

## 1. Visão Geral do Fluxo

```text
[Super Admin no Painel]
         |
         | 1. Seleciona usuário em /admin/institutions ou catálogo global
         | 2. Preenche justificativa de suporte (mínimo 5 caracteres)
         v
[Edge Function: impersonate-user]
         |
         | 3. Valida permissão do chamador (is_platform_admin = true)
         | 4. Registra auditoria em public.impersonation_audit_logs (started_at = now())
         | 5. Assina JWT manual com claims (sub = target_user, impersonated = true, exp = +45min)
         v
[Retorno ao Frontend]
         |
         | 6. Salva sessão do admin em sessionStorage ("ses_admin_session_backup")
         | 7. Invoca supabase.auth.stopAutoRefresh()
         | 8. Aplica supabase.auth.setSession(...) com o JWT de impersonation
         | 9. Limpa caches operacionais locais (@SmartExit:* e stores de memória)
         v
[Sessão de Suporte Ativa]
         |
         | 10. Banner fixo no topo com aviso visual, e-mail do alvo e timer de 45 min
         | 11. Super Admin navega e reproduz problemas sob as regras de RLS do tenant
         v
[Encerramento de Suporte]
         |
         | 12. Clique em "Encerrar Sessão" no banner (ou timeout de 45 minutos)
         | 13. Chama Edge Function end-impersonation (atualiza ended_at no log)
         | 14. Limpa caches da escola impersonada
         | 15. Restaura sessão do admin salva em sessionStorage
         | 16. Invoca supabase.auth.startAutoRefresh()
         v
[Retorno ao Painel de Super Admin]
```

---

## 2. Como o Super Admin Inicia uma Sessão de Suporte

1. O operador com privilégios de Super Admin autentica-se normalmente na plataforma.
2. Acessa a área administrativa em `/admin/institutions` ou o catálogo de usuários.
3. No painel de membros da escola ou na listagem de usuários, clica no botão de ação **"Entrar como usuário"**.
4. Um modal de confirmação é exibido solicitando obrigatoriamente:
   - A **justificativa do atendimento** (ex.: *"Investigação de chamado de suporte #412 — erro ao chamar aluno na fila de saída"*). A justificativa deve conter pelo menos 5 caracteres válidos.
5. Ao confirmar, o frontend invoca a Edge Function e efetua a transição de sessão sem necessidade de deslogar manualmente.

---

## 3. O Que Acontece no Backend

A Edge Function `impersonate-user` executa as seguintes etapas atômicas:

1. **Autenticação e Autorização:**
   - Extrai o token Bearer do cabeçalho `Authorization`.
   - Executa a função SQL `public.is_platform_admin()` para certificar que o chamador é um Super Admin legítimo cadastrado em `public.platform_admins`.
   - Se não for Super Admin, rejeita a chamada imediatamente com código `HTTP 403 Forbidden`.
2. **Validação do Usuário Alvo:**
   - Consulta o perfil e os metadados do `target_user_id` em `auth.users` e `public.profiles`.
   - Garante que a justificativa informada tenha pelo menos 5 caracteres (sem contar espaços em branco).
3. **Persistência da Auditoria:**
   - Cria um registro em `public.impersonation_audit_logs` contendo:
     - `super_admin_id`: UUID do Super Admin autenticado;
     - `target_user_id`: UUID do usuário que será personificado;
     - `target_user_email`: snapshot imutável do e-mail do usuário;
     - `target_user_name`: snapshot imutável do nome do usuário;
     - `target_school_id`: UUID da instituição associada (se aplicável);
     - `reason`: justificativa fornecida;
     - `started_at`: timestamp atual (`now()`);
     - `ended_at`: nulo (`null`).
4. **Cunhagem do JWT Manual:**
   - Gera um token JWT com algoritmo HS256 assinado com `SUPABASE_AUTH_JWT_SECRET`.
   - Claims inseridas no token:
     - `sub`: `target_user_id`
     - `role`: `'authenticated'`
     - `email`: e-mail do alvo
     - `exp`: tempo atual + 45 minutos (2700 segundos)
     - `impersonated`: `true`
     - `impersonated_by`: `super_admin_id`
     - `impersonation_log_id`: ID do registro gerado em `impersonation_audit_logs`
   - Retorna o `access_token` juntamente com a sentinela `refresh_token: 'impersonation_no_refresh'`.

---

## 4. Como o Banner de Suporte Funciona

Durante toda a sessão de personificação, o componente `ImpersonationBanner` permanece fixado no topo da interface:

- **Destaque Visual de Alerta:** Barra de cor âmbar/dourada chamativa informando claramente:  
  *“Você está operando como [Nome/Email do Usuário] — Modo Suporte Técnico”*.
- **Contador Regressivo (Countdown Timer):** Exibe o tempo restante em minutos e segundos até a expiração do token (contagem a partir de 45:00).
- **Proteção Visual:** Alerta visual quando restarem menos de 5 minutos.
- **Botão de Encerramento:** Permite finalizar a sessão voluntariamente a qualquer instante.
- **Auto-Exit:** Se o contador zerar (45 minutos), o banner automaticamente encerra a sessão, restaura o admin e notifica o usuário sobre a expiração.

---

## 5. Como Encerrar a Sessão e Retornar ao Admin

Ao clicar em **"Encerrar Sessão"** ou ao expirar o tempo limite:

1. O frontend chama o endpoint da Edge Function `end-impersonation`, passando o `impersonation_log_id`.
2. A Edge Function atualiza o registro correspondente em `public.impersonation_audit_logs`, gravando `ended_at = now()`.
3. O cliente frontend executa a limpeza completa dos estados e caches:
   - Remove as chaves de dados do tenant no `localStorage` (padrão `@SmartExit:*`).
   - Reseta os stores em memória (`schoolOpsStore`, dados de chamadas e portões).
4. O cliente recupera a sessão original do Super Admin arquivada no `sessionStorage` (`ses_admin_session_backup`).
5. Invoca `supabase.auth.setSession(adminSession)`.
6. Reativa a renovação automática de tokens via `supabase.auth.startAutoRefresh()`.
7. Redireciona o Super Admin de volta para `/admin/institutions`.

---

## 6. Onde a Auditoria Fica e Como Consultá-la

Todos os acessos ficam registrados de forma permanente na tabela `public.impersonation_audit_logs`.

### Estrutura do Registro de Auditoria

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador único da sessão de impersonation |
| `super_admin_id` | `uuid` | UUID do operador Super Admin que iniciou a sessão |
| `target_user_id` | `uuid` | UUID do usuário escolar personificado |
| `target_user_email` | `text` | E-mail do usuário no momento do início da sessão (snapshot) |
| `target_user_name` | `text` | Nome do usuário no momento do início da sessão (snapshot) |
| `target_school_id` | `uuid` | Instituição à qual o usuário pertencia |
| `reason` | `text` | Justificativa do atendimento registrada pelo operador |
| `started_at` | `timestamptz` | Data e hora exatas de início da sessão |
| `ended_at` | `timestamptz` | Data e hora exatas de encerramento da sessão (ou null se ativa) |

### Consulta SQL para Auditoria (Executada por Administradores)

```sql
select
  l.id as session_id,
  p.full_name as super_admin_name,
  l.target_user_email,
  l.target_user_name,
  s.name as school_name,
  l.reason,
  l.started_at,
  l.ended_at,
  age(coalesce(l.ended_at, now()), l.started_at) as session_duration
from public.impersonation_audit_logs l
left join public.profiles p on p.id = l.super_admin_id
left join public.schools s on s.id = l.target_school_id
order by l.started_at desc;
```

---

## 7. Limitações Conhecidas

- **TTL Fixo de 45 Minutos:** Por motivos de segurança, tokens de suporte expiram estritamente após 45 minutos e não podem ser estendidos. Caso o atendimento demande mais tempo, o operador deve abrir uma nova sessão com nova justificativa.
- **Token Não Renovável (Sem Refresh Token):** O token manual não possui entrada em `auth.sessions`, de modo que a renovação de sessão é desativada propositalmente.
- **Sessão Single-Tab / Isolada:** A sessão salva de backup é armazenada no `sessionStorage` da aba onde a impersonation foi iniciada.

---

## 8. Considerações de Segurança e Blindagem RLS

1. **Princípio do Menor Privilégio:** Durante a personificação, o Super Admin adquire estritamente os direitos e limites do usuário alvo no banco de dados. Se o alvo for um porteiro, o token não consegue ler turmas de outros colégios nem acessar tabelas restritas.
2. **Não Escalonamento de Privilégios:** Mesmo que um usuário comum descubra a existência das rotas de impersonation, chamadas diretas às RPCs (`list_platform_users`) e às Edge Functions são bloqueadas com `42501` ou `403 Forbidden`.
3. **Imutabilidade da Trilha de Auditoria:**
   - Usuários autenticados regulares e sessões impersonadas não possuem permissão de `INSERT`, `UPDATE` ou `DELETE` na tabela `impersonation_audit_logs`. A escrita é restrita às Edge Functions via `service_role`.
   - Constraints de banco (`ended_at >= started_at` e `length(trim(reason)) >= 5`) garantem a integridade dos dados mesmo contra falhas lógicas.
4. **Isolamento Multi-Tenant:** Todas as políticas de Row Level Security (RLS) continuam ativas e filtram os dados com base no `auth.uid()`, assegurando isolamento completo entre tenants.
