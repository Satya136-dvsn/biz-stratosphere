-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Function to automatically create notification on file upload
CREATE OR REPLACE FUNCTION create_upload_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (
    NEW.user_id,
    'File Uploaded Successfully',
    'Your file "' || NEW.file_name || '" has been uploaded and processed.',
    'success',
    '/dashboard'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification on file upload
DROP TRIGGER IF EXISTS on_dataset_upload ON datasets;
CREATE TRIGGER on_dataset_upload
  AFTER INSERT ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION create_upload_notification();

-- Insert some sample notifications for testing (optional, remove in production)
-- INSERT INTO notifications (user_id, title, message, type)
-- SELECT 
--   auth.uid(),
--   'Welcome to Biz Stratosphere!',
--   'Your account has been created successfully. Start by uploading your first dataset.',
--   'info'
-- WHERE auth.uid() IS NOT NULL;
