-- Fix public profile exposure - restrict to authenticated users viewing marketplace designs
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more restrictive policy that allows authenticated users to view profiles
-- This is needed for marketplace to show seller names
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);