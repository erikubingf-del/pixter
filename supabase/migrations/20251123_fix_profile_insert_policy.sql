-- Migration: Fix Profile Insert Policy
-- Created: 2025-11-23
-- Description: Add missing INSERT policy for profiles table to fix "Database error saving new user"
--
-- Issue: Users couldn't create their own profile during signup
-- Root Cause: Missing INSERT policy on profiles table
-- Fix: Allow both:
--   1. Service role (for trigger-based inserts during signup)
--   2. Authenticated users (for manual profile creation)

-- ============================================================================
-- PROFILES TABLE - ADD INSERT POLICY
-- ============================================================================

-- Drop existing insert policy if it exists (in case we're re-running)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Policy 1: Allow service role to insert profiles (used by handle_new_user trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy 2: Allow authenticated users to insert their own profile
-- (Useful for manual profile creation scenarios)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Service role can insert profiles" ON profiles IS
  'Allows the service role to create profiles. This is used by the handle_new_user() trigger which runs during signup with SECURITY DEFINER privileges.';

COMMENT ON POLICY "Users can insert own profile" ON profiles IS
  'Allows authenticated users to create their own profile. The auth.uid() = id check ensures users can only create a profile for themselves.';
