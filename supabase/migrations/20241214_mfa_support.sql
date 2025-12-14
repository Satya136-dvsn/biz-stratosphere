-- Migration: Add Multi-Factor Authentication (MFA) support
-- Version: 2.2.0
-- Date: 2024-12-14
-- Description: Add tables and policies for TOTP-based MFA, backup codes, and trusted devices

-- ============================================================================
-- TABLE: mfa_secrets
-- Stores encrypted TOTP secrets for users who have enabled MFA
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    secret_encrypted TEXT NOT NULL, -- TOTP secret (encrypted)
    is_enabled BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure secret is not empty
    CONSTRAINT secret_not_empty CHECK (length(secret_encrypted) > 0)
);

-- Index for quick user lookup
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user 
ON mfa_secrets(user_id);

-- Index for enabled MFA lookup
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_enabled 
ON mfa_secrets(user_id, is_enabled) 
WHERE is_enabled = true;

COMMENT ON TABLE mfa_secrets IS 'Stores TOTP secrets for users with MFA enabled';
COMMENT ON COLUMN mfa_secrets.secret_encrypted IS 'Encrypted TOTP secret (Base32)';
COMMENT ON COLUMN mfa_secrets.is_enabled IS 'Whether MFA is currently active for this user';
COMMENT ON COLUMN mfa_secrets.is_verified IS 'Whether user has verified MFA setup';

-- ============================================================================
-- TABLE: mfa_backup_codes
-- Stores hashed backup recovery codes (one-time use)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, -- Bcrypt hash of the code
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure code hash is not empty
    CONSTRAINT code_hash_not_empty CHECK (length(code_hash) > 0)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user 
ON mfa_backup_codes(user_id);

-- Index for unused codes
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_unused 
ON mfa_backup_codes(user_id, used_at) 
WHERE used_at IS NULL;

COMMENT ON TABLE mfa_backup_codes IS 'Backup recovery codes for MFA (hashed, one-time use)';
COMMENT ON COLUMN mfa_backup_codes.code_hash IS 'Bcrypt hash of recovery code';
COMMENT ON COLUMN mfa_backup_codes.used_at IS 'Timestamp when code was used (NULL = unused)';

-- ============================================================================
-- TABLE: mfa_trusted_devices
-- Tracks devices that user has marked as trusted (30-day trust period)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    user_agent TEXT,
    ip_address INET,
    trusted_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one trust per device per user
    CONSTRAINT unique_user_device UNIQUE(user_id, device_fingerprint)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_user 
ON mfa_trusted_devices(user_id);

-- Index for active trusts
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_active 
ON mfa_trusted_devices(user_id, trusted_until) 
WHERE trusted_until > NOW();

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_expired 
ON mfa_trusted_devices(trusted_until) 
WHERE trusted_until <= NOW();

COMMENT ON TABLE mfa_trusted_devices IS 'Devices trusted by user to skip MFA for 30 days';
COMMENT ON COLUMN mfa_trusted_devices.device_fingerprint IS 'Browser fingerprint hash';
COMMENT ON COLUMN mfa_trusted_devices.trusted_until IS 'Trust expires after this timestamp';

-- ============================================================================
-- TABLE: mfa_verification_attempts
-- Audit log of all MFA verification attempts (success and failure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    method TEXT NOT NULL, -- 'totp' or 'backup_code'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure method is valid
    CONSTRAINT valid_method CHECK (method IN ('totp', 'backup_code'))
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_mfa_verification_user 
ON mfa_verification_attempts(user_id, created_at DESC);

-- Index for failed attempts (for rate limiting)
CREATE INDEX IF NOT EXISTS idx_mfa_verification_failed 
ON mfa_verification_attempts(user_id, created_at DESC) 
WHERE success = false;

COMMENT ON TABLE mfa_verification_attempts IS 'Audit log of MFA verification attempts';
COMMENT ON COLUMN mfa_verification_attempts.method IS 'Verification method: totp or backup_code';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all MFA tables
ALTER TABLE mfa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_attempts ENABLE ROW LEVEL SECURITY;

-- MFA Secrets Policies
CREATE POLICY "Users can view own MFA secrets"
ON mfa_secrets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA secrets"
ON mfa_secrets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA secrets"
ON mfa_secrets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own MFA secrets"
ON mfa_secrets FOR DELETE
USING (auth.uid() = user_id);

-- Backup Codes Policies
CREATE POLICY "Users can view own backup codes"
ON mfa_backup_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backup codes"
ON mfa_backup_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backup codes"
ON mfa_backup_codes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backup codes"
ON mfa_backup_codes FOR DELETE
USING (auth.uid() = user_id);

-- Trusted Devices Policies
CREATE POLICY "Users can view own trusted devices"
ON mfa_trusted_devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trusted devices"
ON mfa_trusted_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trusted devices"
ON mfa_trusted_devices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trusted devices"
ON mfa_trusted_devices FOR DELETE
USING (auth.uid() = user_id);

-- Verification Attempts Policies  
CREATE POLICY "Users can view own verification attempts"
ON mfa_verification_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification attempts"
ON mfa_verification_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if user has MFA enabled
CREATE OR REPLACE FUNCTION is_mfa_enabled(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mfa_secrets
        WHERE user_id = p_user_id
        AND is_enabled = true
        AND is_verified = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining backup codes count
CREATE OR REPLACE FUNCTION get_backup_codes_remaining(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM mfa_backup_codes
        WHERE user_id = p_user_id
        AND used_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(
    p_user_id UUID,
    p_device_fingerprint TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mfa_trusted_devices
        WHERE user_id = p_user_id
        AND device_fingerprint = p_device_fingerprint
        AND trusted_until > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log MFA verification attempt
CREATE OR REPLACE FUNCTION log_mfa_verification(
    p_user_id UUID,
    p_success BOOLEAN,
    p_method TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
BEGIN
    INSERT INTO mfa_verification_attempts (
        user_id,
        success,
        method,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_success,
        p_method,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired trusted devices
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM mfa_trusted_devices
    WHERE trusted_until <= NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mfa_secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mfa_secrets_updated_at
BEFORE UPDATE ON mfa_secrets
FOR EACH ROW
EXECUTE FUNCTION update_mfa_secrets_updated_at();

-- Trigger to update last_used_at on trusted devices
CREATE OR REPLACE FUNCTION update_trusted_device_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trusted_devices_last_used
BEFORE UPDATE ON mfa_trusted_devices
FOR EACH ROW
EXECUTE FUNCTION update_trusted_device_last_used();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for user MFA status
CREATE OR REPLACE VIEW user_mfa_status AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(ms.is_enabled, false) as mfa_enabled,
    COALESCE(ms.is_verified, false) as mfa_verified,
    ms.verified_at,
    (SELECT COUNT(*) FROM mfa_backup_codes 
     WHERE user_id = u.id AND used_at IS NULL) as backup_codes_remaining,
    (SELECT COUNT(*) FROM mfa_trusted_devices 
     WHERE user_id = u.id AND trusted_until > NOW()) as trusted_devices_count,
    (SELECT COUNT(*) FROM mfa_verification_attempts 
     WHERE user_id = u.id AND created_at > NOW() - INTERVAL '24 hours') as verifications_24h
FROM auth.users u
LEFT JOIN mfa_secrets ms ON ms.user_id = u.id;

-- View for MFA statistics
CREATE OR REPLACE VIEW mfa_statistics AS
SELECT 
    COUNT(DISTINCT user_id) as users_with_mfa_setup,
    COUNT(DISTINCT user_id) FILTER (WHERE is_enabled = true) as users_with_mfa_enabled,
    COUNT(DISTINCT user_id) FILTER (WHERE is_verified = true) as users_with_mfa_verified,
    ROUND(
        (COUNT(DISTINCT user_id) FILTER (WHERE is_enabled = true)::DECIMAL / 
         NULLIF(COUNT(DISTINCT user_id), 0)) * 100,
        2
    ) as mfa_adoption_percentage
FROM mfa_secrets;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON mfa_secrets TO authenticated;
GRANT ALL ON mfa_backup_codes TO authenticated;
GRANT ALL ON mfa_trusted_devices TO authenticated;
GRANT ALL ON mfa_verification_attempts TO authenticated;
GRANT SELECT ON user_mfa_status TO authenticated;
GRANT SELECT ON mfa_statistics TO authenticated;

-- ============================================================================
-- SCHEDULED CLEANUP
-- ============================================================================

-- Note: This would typically be run as a cron job
-- For now, it's just a function that can be called manually or via Edge Function

COMMENT ON FUNCTION cleanup_expired_trusted_devices() IS 
'Run daily to remove expired trusted devices. Can be called via Edge Function or pg_cron.';

-- ============================================================================
-- HELPFUL COMMENTS
-- ============================================================================

COMMENT ON SCHEMA public IS 'MFA tables added for Two-Factor Authentication support';
