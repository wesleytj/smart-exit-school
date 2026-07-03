insert into public.pickup_events (
    school_id,
    student_enrollment_id,
    gate_id,
    status,
    called_at
)
select
    s.id,
    'af7f6eb3-c33d-4979-abf5-da3407583ce3',
    'f694b60d-64da-427a-9ae5-74f86c4c3cd5',
    'called',
    now()
from public.schools s
where s.slug = 'smart-exit-dev-school';