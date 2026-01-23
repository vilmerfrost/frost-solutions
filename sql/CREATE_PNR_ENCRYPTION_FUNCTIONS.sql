-- =============================================================================
-- PNR (Personnummer) Encryption Functions for GDPR Compliance
-- Uses pgcrypto extension with AES-256-CBC encryption
-- =============================================================================

-- Enable pgcrypto extension (run once as superuser)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- Function: app_encrypt_text
-- Encrypts plaintext using AES-256-CBC with the provided key
-- Returns Base64-encoded ciphertext
-- =============================================================================
CREATE OR REPLACE FUNCTION app_encrypt_text(
  p_plaintext TEXT,
  p_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_bytes BYTEA;
  v_iv BYTEA;
  v_encrypted BYTEA;
  v_result TEXT;
BEGIN
  -- Validate inputs
  IF p_plaintext IS NULL OR p_plaintext = '' THEN
    RAISE EXCEPTION 'Plaintext cannot be empty';
  END IF;
  
  IF p_key IS NULL OR length(p_key) < 16 THEN
    RAISE EXCEPTION 'Encryption key must be at least 16 characters';
  END IF;
  
  -- Derive a 32-byte key using SHA-256 hash of the provided key
  v_key_bytes := digest(p_key, 'sha256');
  
  -- Generate random IV (16 bytes for AES)
  v_iv := gen_random_bytes(16);
  
  -- Encrypt using AES-256-CBC
  v_encrypted := encrypt_iv(
    convert_to(p_plaintext, 'UTF8'),
    v_key_bytes,
    v_iv,
    'aes-cbc/pad:pkcs'
  );
  
  -- Combine IV + ciphertext and encode as Base64
  -- Format: [16 bytes IV][encrypted data]
  v_result := encode(v_iv || v_encrypted, 'base64');
  
  RETURN v_result;
END;
$$;

-- =============================================================================
-- Function: app_decrypt_text
-- Decrypts Base64-encoded ciphertext using AES-256-CBC with the provided key
-- Returns the original plaintext
-- =============================================================================
CREATE OR REPLACE FUNCTION app_decrypt_text(
  p_ciphertext TEXT,
  p_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_bytes BYTEA;
  v_combined BYTEA;
  v_iv BYTEA;
  v_encrypted BYTEA;
  v_decrypted BYTEA;
  v_result TEXT;
BEGIN
  -- Validate inputs
  IF p_ciphertext IS NULL OR p_ciphertext = '' THEN
    RAISE EXCEPTION 'Ciphertext cannot be empty';
  END IF;
  
  IF p_key IS NULL OR length(p_key) < 16 THEN
    RAISE EXCEPTION 'Encryption key must be at least 16 characters';
  END IF;
  
  -- Derive the same 32-byte key using SHA-256 hash
  v_key_bytes := digest(p_key, 'sha256');
  
  -- Decode Base64 to get combined IV + ciphertext
  v_combined := decode(p_ciphertext, 'base64');
  
  -- Extract IV (first 16 bytes) and ciphertext (rest)
  v_iv := substring(v_combined FROM 1 FOR 16);
  v_encrypted := substring(v_combined FROM 17);
  
  -- Decrypt using AES-256-CBC
  v_decrypted := decrypt_iv(
    v_encrypted,
    v_key_bytes,
    v_iv,
    'aes-cbc/pad:pkcs'
  );
  
  -- Convert back to text
  v_result := convert_from(v_decrypted, 'UTF8');
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$;

-- =============================================================================
-- Grant execute permissions to authenticated users
-- =============================================================================
GRANT EXECUTE ON FUNCTION app_encrypt_text(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION app_decrypt_text(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION app_encrypt_text(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION app_decrypt_text(TEXT, TEXT) TO service_role;

-- =============================================================================
-- Test the functions (optional - run manually)
-- =============================================================================
-- DO $$
-- DECLARE
--   v_encrypted TEXT;
--   v_decrypted TEXT;
--   v_test_key TEXT := 'my-super-secret-32-char-key-here';
--   v_test_pnr TEXT := '199001011234';
-- BEGIN
--   -- Test encryption
--   v_encrypted := app_encrypt_text(v_test_pnr, v_test_key);
--   RAISE NOTICE 'Encrypted: %', v_encrypted;
--   
--   -- Test decryption
--   v_decrypted := app_decrypt_text(v_encrypted, v_test_key);
--   RAISE NOTICE 'Decrypted: %', v_decrypted;
--   
--   -- Verify
--   IF v_decrypted = v_test_pnr THEN
--     RAISE NOTICE '✅ Encryption/Decryption test PASSED';
--   ELSE
--     RAISE EXCEPTION '❌ Test FAILED: Expected %, got %', v_test_pnr, v_decrypted;
--   END IF;
-- END;
-- $$;

-- =============================================================================
-- IMPORTANT: Add PNR_ENCRYPTION_KEY to your environment variables
-- Generate a secure 32+ character key:
--   openssl rand -base64 32
-- Add to .env.local and Vercel:
--   PNR_ENCRYPTION_KEY=your-generated-key-here
-- =============================================================================
