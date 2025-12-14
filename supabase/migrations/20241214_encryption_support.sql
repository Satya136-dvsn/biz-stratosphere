-- Migration: Add encryption support to datasets table
-- Version: 2.1.0
-- Date: 2024-12-14
-- Description: Add columns for encrypted dataset storage

-- Add encryption-related columns to datasets table
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS encrypted_blob JSONB,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS encrypted_at TIMESTAMP WITH TIME ZONE;

-- Create index for encrypted datasets
CREATE INDEX IF NOT EXISTS idx_datasets_encrypted 
ON datasets(user_id, is_encrypted);

-- Add comment explaining encryption structure
COMMENT ON COLUMN datasets.encrypted_blob IS 'Encrypted dataset containing: ciphertext, iv, tag, algorithm, version';
COMMENT ON COLUMN datasets.is_encrypted IS 'Flag indicating if dataset is encrypted with E2E encryption';
COMMENT ON COLUMN datasets.encryption_version IS 'Version of encryption algorithm used (for future migrations)';
COMMENT ON COLUMN datasets.encrypted_at IS 'Timestamp when dataset was encrypted';

-- Create view for encryption statistics
CREATE OR REPLACE VIEW user_encryption_stats AS
SELECT 
    user_id,
    COUNT(*) as total_datasets,
    SUM(CASE WHEN is_encrypted THEN 1 ELSE 0 END) as encrypted_datasets,
    SUM(CASE WHEN NOT is_encrypted THEN 1 ELSE 0 END) as unencrypted_datasets,
    ROUND(
        (SUM(CASE WHEN is_encrypted THEN 1 ELSE 0 END)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as encryption_percentage
FROM datasets
GROUP BY user_id;

-- Add RLS policies for encrypted datasets
-- Users can only see their own encrypted datasets
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own datasets
CREATE POLICY "Users can view own datasets"
ON datasets FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own datasets
CREATE POLICY "Users can insert own datasets"
ON datasets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own datasets
CREATE POLICY "Users can update own datasets"
ON datasets FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own datasets  
CREATE POLICY "Users can delete own datasets"
ON datasets FOR DELETE
USING (auth.uid() = user_id);

-- Create audit log for encryption events
CREATE TABLE IF NOT EXISTS encryption_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'encrypt', 'decrypt', 'key_rotation', 'key_unlock'
    event_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_encryption_audit_user 
ON encryption_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_encryption_audit_dataset 
ON encryption_audit_log(dataset_id, created_at DESC);

-- RLS for audit log
ALTER TABLE encryption_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encryption audit logs"
ON encryption_audit_log FOR SELECT
USING (auth.uid() = user_id);

-- Function to log encryption events
CREATE OR REPLACE FUNCTION log_encryption_event(
    p_user_id UUID,
    p_dataset_id UUID,
    p_event_type TEXT,
    p_event_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO encryption_audit_log (
        user_id,
        dataset_id,
        event_type,
        event_details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_dataset_id,
        p_event_type,
        p_event_details,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log encryption events
CREATE OR REPLACE FUNCTION trigger_log_encryption()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.is_encrypted = true) THEN
        PERFORM log_encryption_event(
            NEW.user_id,
            NEW.id,
            'encrypt',
            jsonb_build_object(
                'filename', NEW.file_name,
                'row_count', NEW.row_count,
                'column_count', NEW.column_count
            )
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.is_encrypted = false AND NEW.is_encrypted = true) THEN
        PERFORM log_encryption_event(
            NEW.user_id,
            NEW.id,
            'encrypt',
            jsonb_build_object(
                'filename', NEW.file_name,
                'migrated', true
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_dataset_encryption
AFTER INSERT OR UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION trigger_log_encryption();

-- Create table for user encryption keys (encrypted DEK storage)
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_dek JSONB NOT NULL, -- Encrypted Data Encryption Key
    salt TEXT NOT NULL, -- Salt for PBKDF2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rotated_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    
    CONSTRAINT valid_encrypted_dek CHECK (
        encrypted_dek ? 'ciphertext' AND
        encrypted_dek ? 'iv' AND
        encrypted_dek ? 'tag' AND
        encrypted_dek ? 'algorithm'
    )
);

-- Index for key lookups
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_user 
ON user_encryption_keys(user_id);

-- RLS for encryption keys
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encryption keys"
ON user_encryption_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own encryption keys"
ON user_encryption_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own encryption keys"
ON user_encryption_keys FOR UPDATE
USING (auth.uid() = user_id);

-- Function to initialize user encryption on signup
CREATE OR REPLACE FUNCTION initialize_user_encryption()
RETURNS TRIGGER AS $$
BEGIN
    -- User encryption keys will be initialized from client side
    -- This trigger just ensures the user is ready for encryption
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run on new user creation
CREATE TRIGGER on_user_created_initialize_encryption
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_encryption();

-- Create table for recovery keys
CREATE TABLE IF NOT EXISTS recovery_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL, -- Hashed recovery key (not the key itself)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Index for recovery key lookups
CREATE INDEX IF NOT EXISTS idx_recovery_keys_user 
ON recovery_keys(user_id, is_active);

-- RLS for recovery keys
ALTER TABLE recovery_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recovery keys"
ON recovery_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery keys"
ON recovery_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Analytics: Daily encryption metrics
CREATE TABLE IF NOT EXISTS encryption_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_encrypted_datasets INTEGER DEFAULT 0,
    total_encryptions_today INTEGER DEFAULT 0,
    total_decryptions_today INTEGER DEFAULT 0,
    average_encryption_time_ms INTEGER,
    
    UNIQUE(metric_date)
);

-- Grant necessary permissions
GRANT ALL ON datasets TO authenticated;
GRANT ALL ON user_encryption_keys TO authenticated;
GRANT ALL ON encryption_audit_log TO authenticated;
GRANT ALL ON recovery_keys TO authenticated;
GRANT SELECT ON user_encryption_stats TO authenticated;
GRANT SELECT ON encryption_metrics TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_encryption_keys IS 'Stores user encryption keys (DEK encrypted with password-derived master key)';
COMMENT ON TABLE encryption_audit_log IS 'Audit trail for all encryption/decryption events';
COMMENT ON TABLE recovery_keys IS 'Recovery keys for account recovery (hashed)';
COMMENT ON VIEW user_encryption_stats IS 'Statistics about user encryption adoption';
