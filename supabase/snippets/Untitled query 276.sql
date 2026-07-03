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
    '73be2486-f3d6-4929-b206-5c05e13b9a16',
    'called',
    now()
from public.schools s
where s.slug = 'smart-exit-dev-school'
returning *;