select
    pe.id,
    st.full_name as student_name,
    ag.name as academic_group_name,
    g.name as gate_name,
    pe.status,
    pe.called_at,
    pe.completed_at,
    pe.cancelled_at
from public.pickup_events pe
join public.student_enrollments se
    on se.id = pe.student_enrollment_id
join public.students st
    on st.id = se.student_id
left join public.student_group_assignments sga
    on sga.student_enrollment_id = se.id
   and sga.status = 'active'
left join public.academic_groups ag
    on ag.id = sga.academic_group_id
join public.gates g
    on g.id = pe.gate_id
where pe.student_enrollment_id = 'af7f6eb3-c33d-4979-abf5-da3407583ce3'
order by pe.called_at asc;