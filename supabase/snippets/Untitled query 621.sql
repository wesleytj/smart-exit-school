insert into public.pickup_events (
    school_id,
    student_enrollment_id,
    gate_id,
    status,
    called_at,
    completed_at
)
select
    s.id,
    'af7f6eb3-c33d-4979-abf5-da3407583ce3',
    '14b4599a-96fe-4929-a8e0-6d60275aa2c6',
    'called',
    now(),
    now()
from public.schools s
where s.slug = 'smart-exit-dev-school';