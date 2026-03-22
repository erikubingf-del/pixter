-- Local-only seed data for Pixter development.
-- Creates the public buckets used by onboarding, avatars, and receipts.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('selfies', 'selfies', true),
  ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;
