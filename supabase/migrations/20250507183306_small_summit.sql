/*
  # Authentication Schema Setup

  1. New Tables
    - `auth_logs`
      - Track authentication attempts
      - Store IP addresses and timestamps
      - Monitor failed attempts

  2. Security
    - Enable RLS
    - Add policies for access control
*/

-- Create auth logs table
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  ip_address text NOT NULL,
  success boolean NOT NULL,
  attempt_count integer DEFAULT 1,
  locked_until timestamptz,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own auth logs"
  ON auth_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_auth_logs_user_email ON auth_logs(email);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);

-- Function to check and update failed attempts
CREATE OR REPLACE FUNCTION check_failed_attempts()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT NEW.success THEN
    -- Update attempt count and potentially lock account
    UPDATE auth_logs
    SET 
      attempt_count = attempt_count + 1,
      locked_until = CASE 
        WHEN attempt_count >= 3 THEN now() + interval '30 seconds'
        ELSE NULL
      END
    WHERE email = NEW.email
    AND created_at > now() - interval '30 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for failed attempts
CREATE TRIGGER check_failed_attempts_trigger
  AFTER INSERT ON auth_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_failed_attempts();