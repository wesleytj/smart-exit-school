select
    indexname,
    indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'student_group_assignments'
order by indexname;