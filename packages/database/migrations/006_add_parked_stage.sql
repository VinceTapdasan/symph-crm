-- ---------------------------------------------------------------------------
-- Migration 006: Add "Parked" pipeline stage
-- Inserts 'parked' after 'followup' (sort_order 5) and bumps closed stages
-- to 6 and 7 to maintain ordering integrity.
-- Idempotent — safe to re-run.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  ws_id UUID := '60f84f03-283e-4c1a-8c88-b8330dc71d32';
BEGIN
  -- Bump closed_won and closed_lost sort_orders to make room for parked at 5
  UPDATE pipeline_stages
    SET sort_order = 6
    WHERE workspace_id = ws_id AND slug = 'closed_won';

  UPDATE pipeline_stages
    SET sort_order = 7
    WHERE workspace_id = ws_id AND slug = 'closed_lost';

  -- Insert parked stage if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pipeline_stages WHERE workspace_id = ws_id AND slug = 'parked'
  ) THEN
    INSERT INTO pipeline_stages (workspace_id, slug, label, color, sort_order)
    VALUES (ws_id, 'parked', 'Parked', '#64748b', 5);
  END IF;
END $$;

COMMIT;
