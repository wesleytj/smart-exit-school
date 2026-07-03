select
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t
    on c.conrelid = t.oid
join pg_namespace n
    on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'student_group_assignments'
  and c.contype = 'c';