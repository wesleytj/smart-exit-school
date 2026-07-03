insert into public.student_group_assignments (
    student_enrollment_id,
    academic_group_id,
    status
)
select
    se.id,
    ag.id,
    'active'
from public.student_enrollments se
join public.students st
    on st.id = se.student_id
join public.schools s
    on s.id = st.school_id
join public.academic_groups ag
    on ag.school_id = s.id
join public.academic_shifts ash
    on ash.id = ag.academic_shift_id
where st.student_identifier = 'STU-0001'
  and se.academic_year = 2026
  and ag.name = 'EF3TA'
  and ash.name = 'afternoon';