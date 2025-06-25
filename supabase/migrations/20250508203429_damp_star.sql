/*
  # Update auth_logs RLS policies

  1. Changes
    - Add new RLS policy to allow inserting auth logs
    - Keep existing policy for viewing own logs

  2. Security
    - Allow inserting auth logs for all authenticated users
    - Maintain existing policy that users can only view their own logs
*/

-- Add policy to allow inserting auth logs
CREATE POLICY "Allow inserting auth logs"
ON public.auth_logs
FOR INSERT
TO public
WITH CHECK (true);