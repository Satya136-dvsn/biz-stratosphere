-- Clean up test/mock churn prediction data
-- Run this in your Supabase SQL editor to remove all test churn data

-- Delete all rows from churn_predictions table
DELETE FROM churn_predictions;

-- Optionally, reset the sequence if you have auto-incrementing IDs
-- ALTER SEQUENCE churn_predictions_id_seq RESTART WITH 1;
