# Histórico de Concepção e Modelagem Embrionária (Junho a Julho 2026)

**Data de Consolidação:** 24/10/2026 (Ciclo I — Higiene Documental)  
**Autoridade:** MyHub / AADS  
**Status:** HISTÓRICO CONSOLIDADO — Preservação de contexto embrionário  
**Nota de Governança:** Este compêndio consolida os 5 documentos originais de `docs/arquitetura/` gerados na fase embrionária do Smart Exit School (`arquitetura-futura.md`, `checklist-modelagem.md`, `modelagem.md`, `padroes.md` e `workflow.md`). A fonte canônica e viva do banco de dados relacional e da arquitetura atual reside em [docs/banco-de-dados.md](../banco-de-dados.md) e [docs/arquitetura.md](../arquitetura.md).

---

## 1. Modelagem do Domínio Original (`modelagem.md`)

*Data original: Julho de 2026*  
Documentava o estágio de concepção das primeiras migrations relacionais do projeto.

### Estado Inicial de Implementação
| Domínio | Modelagem | Migration PostgreSQL |
|---------|:---------:|:--------------------:|
| Authentication Core | ✅ | ✅ `20260628155403` |
| Academic Core | ✅ | ✅ `20260701014657` |
| Academic Enrollment Assignment | ✅ | ✅ `20260702204601` |
| Pickup Core | ✅ | ✅ `20260703154000` |
| Audit Core | 📋 Planejado | ❌ Pendente na época |

### Entidades de Domínio Modeladas
1. **School:** Representa a instituição de ensino (`schools`). Possui membros, níveis acadêmicos, turmas, alunos, matrículas, portões e eventos de chamada.
2. **Profile / Role / School Member:** Representam identidade de usuário e seus vínculos institucionais (`profiles`, `roles`, `school_members`).
3. **Academic Levels & Academic Groups:** Níveis de ensino e turmas associadas com turno (`academic_levels`, `academic_groups`).
4. **Students, Enrollments & Assignments:** Matrículas de alunos e alocação por turma (`students`, `student_enrollments`, `student_group_assignments`).
5. **Gates & Pickup Events:** Portões físicos de saída e registro operacional de chamadas (`gates`, `pickup_events`).

*(Nota: Na arquitetura atual, o schema expandiu para 27 migrations e 17 tabelas com RLS completo, incluindo retenção em `pickup_events_archive` e `impersonation_audit_logs`).*

---

## 2. Checklist de Modelagem Original (`checklist-modelagem.md`)

*Data original: 01/07/2026*  
Definia o processo padrão utilizado na AllTech para modelagem inicial do banco de dados:

1. **Modelagem do domínio:** Definir responsabilidade da entidade, relacionamentos e regras de negócio antes de qualquer SQL.
2. **Revisão arquitetural:** Confirmar nome de tabelas/colunas em inglês, cardinalidade, SRP e pertencimento ao domínio correto.
3. **ADR:** Criar e congelar a Architecture Decision Record antes da implementação de novas estruturas.
4. **Atualização da documentação:** Sincronizar diagramas e especificações antes da execução de migrations.
5. **Revisão técnica de tabelas:**
   - UUID como chave primária (`id`).
   - Tabelas no plural e snake_case (`students`, `pickup_events`).
   - Foreign Keys com índices obrigatórios e integridade referencial (`ON DELETE` revisado).
   - Constraints `NOT NULL`, `DEFAULT`, `CHECK` e `UNIQUE`.
   - Campos de auditoria compulsórios: `created_at` e `updated_at`.
6. **Implementação SQL e Testes:** Executar migrations sequenciais e validar constraints e integridade em banco limpo.

---

## 3. Padrões do Projeto Originais (`padroes.md`)

*Data original: 29/06/2026*  
Convenções oficiais adotadas desde a gênese do Smart Exit School:

- **Filosofia de Engenharia:** Priorizar padrões consolidados da indústria, evitando soluções proprietárias ou over-engineering.
- **Idiomas:** Código, Banco de Dados e APIs estritamente em **Inglês**; Documentação e UI em **Português (pt-BR)**.
- **Convenções SQL:**
  - Tabelas: plural, snake_case (`students`, `guardians`, `school_members`).
  - Colunas: snake_case (`created_at`, `school_id`).
  - Chaves primárias: `id` (UUID).
  - Chaves estrangeiras: `<entidade>_id`.
  - Prefixos de índices e constraints: `idx_`, `pk_`, `fk_`, `uk_`, `ck_`.
- **Migrations:** Uma responsabilidade por migration; proibido alterar migrations já publicadas; sempre criar migrations sequenciais.
- **Services (DAL):** Um domínio por service (`studentService`, `gateService`, `pickupService`). Componentes React nunca acessam o Supabase ou storage diretamente.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).

---

## 4. Workflow de Desenvolvimento Original (`workflow.md`)

*Data original: 29/06/2026*  
Fluxo sequencial prescrito para a evolução do software:
```text
1. Definir regras de negócio
   ↓
2. Registrar decisões arquiteturais (ADR), quando necessário
   ↓
3. Modelar o banco de dados
   ↓
4. Criar Migration
   ↓
5. Atualizar documentação técnica
   ↓
6. Implementar Services (DAL)
   ↓
7. Implementar Frontend
   ↓
8. Testar (Quality Gates)
   ↓
9. Commit semântico
   ↓
10. Push / PR
```

---

## 5. Arquitetura Futura Planejada na Fase Zero (`arquitetura-futura.md`)

*Data original: 29/06/2026*  
Registro dos recursos visionados além do MVP inicial:

- **White Label:** Customização visual e logotipo institucional por escola *(Entregue nos planos Premium/Diamond)*.
- **ACL (Permissões Customizadas):** Gestão granular de papéis e restrições *(Entregue via Supabase Auth + RLS + memberships)*.
- **Aplicativo para Responsáveis:** Acompanhamento da fila de saída por pais e responsáveis *(Permanece em roadmap de longo prazo)*.
- **Integração com ERP / Catracas / RFID / QR Code:** Conectividade de hardware e sistemas legados de portaria *(Roadmap estratégico)*.
- **API Pública & Multi-organizações:** Gestão de redes com múltiplas unidades de ensino *(Roadmap estratégico)*.
