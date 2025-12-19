-- Fix ml_predictions schema to use model_name instead of model_id UUID
-- This allows direct insertion without looking up model UUIDs

-- Step 1: Drop the view that depends on model_id
DROP VIEW IF EXISTS ml_model_stats;

-- Step 2: Drop existing foreign key constraint if it exists
ALTER TABLE ml_predictions DROP CONSTRAINT IF EXISTS ml_predictions_model_id_fkey;

-- Step 3: Alter model_id column to TEXT to store model name directly
ALTER TABLE ml_predictions ALTER COLUMN model_id TYPE TEXT;

-- Step 4: Rename column for clarity
ALTER TABLE ml_predictions RENAME COLUMN model_id TO model_name;

-- Step 5: Add comment
COMMENT ON COLUMN ml_predictions.model_name IS 'Model identifier: churn_model, revenue_model, etc.';

-- Step 6: Recreate the view with updated column
CREATE OR REPLACE VIEW ml_model_stats AS
SELECT 
  model_name,
  COUNT(*) as total_predictions,
  AVG(confidence) as avg_confidence,
  MIN(created_at) as first_prediction,
  MAX(created_at) as last_prediction
FROM ml_predictions
GROUP BY model_name;
