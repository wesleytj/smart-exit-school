# Roadmap — Smart Exit School

Evoluções do Smart Exit School, consolidando entregas recentes concluídas e direcionamentos futuros do produto e da arquitetura.

---

## Entregas Recentes Concluídas (Ciclos A, B e C)

| Entrega | PR / Commit | Escopo & Descrição |
|---|---|---|
| **C3 — Arquivamento de Chamadas de Saída** | PR #86 (Migration 0025) | Tabela `public.pickup_events_archive` para retenção histórica de eventos `completed` e `cancelled`, índices temporais parciais em `pickup_events`, RPC de purga em lote `public.archive_old_pickup_events` restrita a `service_role` e serviço `pickupArchiveService.js`. |
| **C2 — Ordenação e Filtros da Fila** | PR #85 | Controles operacionais flexíveis de ordenação e filtros dinâmicos na fila de chamadas do Monitor (`pickupCallFilter.js`) por portão, turma e busca de aluno. |
| **C1 — Cancelamento com Confirmação** | PR #84 | Diálogo modal de confirmação de cancelamento operacional (`cancelCallDialog.js`), feedback visual imediato e transição atômica de `called` → `cancelled` com timestamp `cancelled_at`. |
| **Ciclo B — Convite e Onboarding de Membros** | PR #82, PR #83 (Migrations 0023, 0024) | Tabela `public.school_invitations`, Edge Functions `invite-member` / `accept-invite`, tela `/accept-invite` e componente `TeamManagementSection` para envio de convites com token de 7 dias via Brevo SMTP. |
| **Bloqueio de Login para Escola Inativa** | PR #80 | Enforce do status `is_active` / `inactive` no momento da resolução de tenant pós-login (`tenantAccess.js`), impedindo acesso administrativo a escolas suspensas. |
| **Impersonation User-Level** | PRs #69, #70, #71, #73, #81 | Suporte operacional em primeira pessoa para Platform Admins via Edge Function (`impersonate-user`), JWT manual HS256, suporte a ES256 cloud, sentinela `impersonation_no_refresh`, TTL 45min, `SupportBanner` e auditoria imutável em `public.impersonation_audit_logs`. |
| **Isolamento Multi-Tenant & Hardening** | PR #65 (Migration 0021) | Reforço de RLS, grants mínimos restritos a `authenticated`, revogação de `TRUNCATE` em todas as tabelas públicas e testes de isolamento multi-tenant cruzados. |
| **Ano Letivo Configurável** | PR #63 (Migration 0020) | Tabela `public.school_years`, vínculo formal de turmas e matrículas ao ano letivo ativo, alternância de ano ativo via `schoolYearService` assegurada por índice parcial único no banco. |
| **Cancelamento Operacional de Chamadas** | PR #62 (Migration 0019) | Transição operacional de status `called` → `cancelled`, registro de timestamp `cancelled_at` e liberação do aluno para nova chamada. |
| **Áudio no Telão de Saída** | PR #61 | Anúncio sonoro automático de chamadas na TV (`/tv`) combinando Chime harmônico (Web Audio API) e síntese de voz (Web Speech API) com fila sequencial e debounce. |
| **Fluxos de Senha e DX** | PR #67, PR #68, PR #72 | Telas `/forgot-password` e `/update-password` integradas ao relay SMTP Brevo, toggle de visualização `PasswordInput`, tipagens Deno e Node. |

---

## Bootstrap de produção

- [x] Produção Supabase criada e migrations aplicadas (0001 a 0025)
- [x] Frontend publicado na Vercel (`https://smart-exit-school.vercel.app`)
- [x] Platform Admin real validado (`/admin/institutions`)
- [x] Primeira instituição criada (Colégio Adventista de Esteio, plano `basic`, status `active`)
- [x] Primeiro tenant escolar validado em produção (conta de teste, membership `owner` ativa, `/painel`)
- [x] Isolamento multi-tenant e RLS endurecidos (Migration 0021)
- [x] Provisionamento ou convite de usuários escolares via UI (Ciclo B — Migration 0023/0024, Edge Functions invite-member / accept-invite, rota /accept-invite)
- [x] Cancelamento, filtros e arquivamento de chamadas operacionais (Ciclo C — PRs #84, #85, #86)
- [ ] Processo de onboarding comercial self-service

---

## Próximas Prioridades (Curto e Médio Prazo)

Itens mapeados para evolução técnica imediata e melhoria operacional:

| Item | Evidência / Escopo | Prioridade sugerida |
|------|--------------------|---------------------|
| **Relatórios e visualizador de auditoria para Super Admin** | Interface em `/admin/institutions` para visualização e filtro dos registros de `public.impersonation_audit_logs` | Média |
| **Histórico e relatórios de saídas** | Consulta e exportação de eventos operacionais `completed`, `cancelled` e arquivados (`pickup_events_archive`) para coordenação escolar | Média |
| **Automação do expurgo de chamadas antigas** | Agendador ou cron job externo para execução periódica da RPC `archive_old_pickup_events` (já que `pg_cron` não está ativo) | Média |
| **Referência Turma → Portão por `gate_id`** | Substituir o campo textual `defaultExit` no cache por chave estrangeira formal em `public.academic_groups` | Média |
| **UI bulk edit para turmas** | Expor interface para alteração em lote de turmas (handlers já existem na DAL) | Baixa |
| **Sincronização em tempo real (Supabase Realtime)** | Substituir polling de 5s no Monitor e Telão por subscrição websocket Postgres Changes em `pickup_events` | Média |

---

## Visão de Longo Prazo

Direcionamentos estratégicos e expansão do ecossistema:

| Item | Evidência / Conceito |
|------|----------------------|
| **App para responsáveis ("Estou Chegando")** | Notificação de proximidade dos pais para organização prévia da fila de saída |
| **Geolocalização e cerca virtual (Geofencing)** | Acionamento automatizado de chamada quando o responsável entra no raio do colégio |
| **Gestão de transporte e frotas escolares (Vans)** | Saída em lote de alunos vinculados a motoristas de van credenciados |
| **Faturamento e Assinaturas (Billing SaaS)** | Integração com gateway de pagamentos (Stripe/Asaas) para cobrança recorrente por plano |
| **Controle de Acesso Físico / Hardware** | Integração com catracas eletrônicas, leitores RFID e totens de identificação facial |
| **Aplicativo Mobile Nativo** | Versões mobile iOS/Android para portaria e operadores de pátio |

---

## Diagrama de Maturidade

```mermaid
quadrantChart
    title Maturidade vs Esforço (Estado Atual Pós-Fase 3)
    x-axis Baixo Esforço --> Alto Esforço
    y-axis Baixa Maturidade --> Alta Maturidade
    quadrant-1 Quick wins
    quadrant-2 Projetos estratégicos
    quadrant-3 Backlog
    quadrant-4 Manutenção

    Monitor & Cancelamento: [0.3, 0.95]
    CRUD Acadêmico & Anos Letivos: [0.35, 0.9]
    Telão TV com Áudio: [0.3, 0.9]
    Impersonation & Auditoria: [0.45, 0.92]
    Super Admin & Catálogo: [0.35, 0.85]
    Import CSV: [0.4, 0.7]
    Whitelabel: [0.45, 0.65]
    Convite Usuário UI: [0.5, 0.4]
    Realtime Pickup: [0.55, 0.45]
    App Responsáveis: [0.95, 0.05]
    Relatórios Avançados: [0.7, 0.15]
    Billing SaaS: [0.85, 0.1]
```

---

## Pontos que precisam de validação humana

- Prioridade entre convite de usuários via UI vs Realtime no telão;
- Escopo comercial da gestão de planos Trial;
- Política de retenção e expurgo dos logs de auditoria (`impersonation_audit_logs`).
