update public.pickup_events
set
    status = 'completed',
    completed_at = now(),
    updated_at = now()
where student_enrollment_id = 'af7f6eb3-c33d-4979-abf5-da3407583ce3'
  and status = 'called'
returning *;