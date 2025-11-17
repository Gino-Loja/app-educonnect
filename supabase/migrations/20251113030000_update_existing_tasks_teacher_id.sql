-- Update existing tasks to set teacher_id from accepted proposals
UPDATE tasks
SET teacher_id = proposals.teacher_id
FROM proposals
WHERE tasks.selected_proposal_id = proposals.id
  AND tasks.teacher_id IS NULL
  AND proposals.status = 'accepted';
