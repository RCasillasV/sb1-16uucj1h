/*
  # Create users table for doctor profiles

  1. New Tables
    - `users`
      - Basic user information
      - Professional credentials
      - Contact details

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  paternal_surname text NOT NULL,
  maternal_surname text NOT NULL,
  date_of_birth date NOT NULL,
  specialty text NOT NULL,
  professional_license text NOT NULL,
  ssa_registration text NOT NULL,
  postal_code text CHECK (postal_code ~ '^[0-9]{6}$'),
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  phones text[] NOT NULL,
  theme_preference text DEFAULT 'light',
  auth_user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
  ON users
  USING (auth.uid() = auth_user_id);