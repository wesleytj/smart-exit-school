-- ============================================================
-- Smart Exit School
-- Migration: 20261003223000_school_years_configurable.sql
-- Description:
--   Creates configurable school years management, binding
--   academic groups and student enrollments to school_years.
-- ============================================================

-- 4.1 Criar public.school_years
create table if not exists public.school_years (
    id uuid primary key default gen_random_uuid(),
    school_id uuid not null references public.schools(id) on delete cascade,
    year integer not null check (year >= 2000),
    is_active boolean not null default false,
    starts_at date not null,
    ends_at date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint school_years_year_range_check check (starts_at <= ends_at),
    constraint school_years_school_year_unique unique (school_id, year)
);

create index if not exists idx_school_years_school_id on public.school_years(school_id);
create index if not exists idx_school_years_year on public.school_years(year);

-- Indice parcial unico (regra de negocio: 1 ano ativo por escola)
create unique index if not exists school_years_one_active_per_school
    on public.school_years (school_id) where is_active = true;

-- 4.2 Adicionar colunas (nullable, antes do backfill)
alter table public.academic_groups
    add column if not exists school_year_id uuid references public.school_years(id);

alter table public.student_enrollments
    add column if not exists school_year_id uuid references public.school_years(id);

-- 4.3 Backfill (idempotente)
-- Criar ano 2026 (ativo) para toda escola existente
insert into public.school_years (school_id, year, is_active, starts_at, ends_at)
select id, 2026, true, make_date(2026, 1, 1), make_date(2026, 12, 31)
from public.schools
on conflict (school_id, year) do nothing;

-- Criar anos adicionais para qualquer academic_year divergente encontrado em matriculas
insert into public.school_years (school_id, year, is_active, starts_at, ends_at)
select distinct s.school_id, se.academic_year, false,
       make_date(se.academic_year, 1, 1), make_date(se.academic_year, 12, 31)
from public.student_enrollments se
join public.students s on s.id = se.student_id
where se.academic_year <> 2026
on conflict (school_id, year) do nothing;

-- Vincular turmas ao ano ativo da escola
update public.academic_groups g
set school_year_id = sy.id
from public.school_years sy
where sy.school_id = g.school_id and sy.is_active = true
  and g.school_year_id is null;

-- Vincular matriculas pelo academic_year correspondente (espelhamento)
update public.student_enrollments se
set school_year_id = sy.id
from public.students s,
     public.school_years sy
where se.student_id = s.id
  and sy.school_id = s.school_id
  and sy.year = se.academic_year
  and se.school_year_id is null;

-- 4.4 Tornar NOT NULL (apos backfill)
alter table public.academic_groups alter column school_year_id set not null;
alter table public.student_enrollments alter column school_year_id set not null;

-- 4.5 Drop & Recreate da constraint de unicidade de academic_groups
alter table public.academic_groups
    drop constraint if exists academic_groups_school_level_shift_name_unique;

alter table public.academic_groups
    drop constraint if exists academic_groups_year_level_shift_name_unique;

alter table public.academic_groups
    add constraint academic_groups_year_level_shift_name_unique
    unique (school_id, academic_level_id, academic_shift_id, school_year_id, name);

-- 4.6 RLS e GRANTs em school_years
alter table public.school_years enable row level security;

drop policy if exists school_years_select_member on public.school_years;
create policy school_years_select_member
on public.school_years
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

drop policy if exists school_years_insert_member on public.school_years;
create policy school_years_insert_member
on public.school_years
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
);

drop policy if exists school_years_update_member on public.school_years;
create policy school_years_update_member
on public.school_years
for update
to authenticated
using (
    public.is_active_school_member(school_id)
)
with check (
    public.is_active_school_member(school_id)
);

drop policy if exists school_years_delete_member on public.school_years;
create policy school_years_delete_member
on public.school_years
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
);

grant select, insert, update, delete on public.school_years to authenticated;
