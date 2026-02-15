-- Encrypt existing WhatsApp credentials
-- This migration encrypts any existing unencrypted WhatsApp access tokens and phone number IDs

-- Note: This migration requires the ENCRYPTION_KEY environment variable to be set
-- The encryption logic is handled in the application code, so this migration is a no-op
-- Existing data will be encrypted on the next read/write operation

-- This is a placeholder migration to document the encryption implementation