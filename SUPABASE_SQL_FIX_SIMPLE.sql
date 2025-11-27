-- ============================================================================
-- SIMPLE FIX: Update Service Role Policy to Allow INSERT
-- ============================================================================
-- Issue: The existing "Service role full access to profiles" policy
--        only has USING clause, which doesn't work for INSERT operations.
--        INSERT requires WITH CHECK clause.
-- Fix: Drop and recreate with both USING and WITH CHECK

-- Drop the existing service role policy
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;

-- Recreate with proper INSERT support (both USING and WITH CHECK)
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add comment
COMMENT ON POLICY "Service role full access to profiles" ON profiles IS
  'Service role has full access to all profile operations (SELECT, INSERT, UPDATE, DELETE). Both USING and WITH CHECK are required for INSERT to work.';
