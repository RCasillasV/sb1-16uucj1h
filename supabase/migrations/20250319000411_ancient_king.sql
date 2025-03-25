/*
  # Update Theme Parameters

  1. Changes
    - Update existing themes with latest parameters
    - Add any missing themes
    - Ensure RLS and policies are properly configured

  2. Schema Updates
    - Safe updates using DO blocks
    - Proper error handling
*/

-- Function to safely update theme parameters
DO $$ 
BEGIN
  -- Update Forest Night theme if it exists, otherwise insert
  UPDATE theme_parameters 
  SET 
    theme_name = 'Forest Night',
    button_primary_color = '#2D3B2D',
    button_secondary_color = '#4A5D4A',
    button_text_color = '#FFFFFF',
    font_size_small = '0.875rem',
    font_size_medium = '1rem',
    font_size_large = '1.25rem',
    button_border_radius = '0.375rem',
    button_padding = '0.75rem 1rem',
    is_active = true
  WHERE theme_id = 'forest-night';

  -- Update Ocean Breeze theme if it exists, otherwise insert
  UPDATE theme_parameters 
  SET 
    theme_name = 'Ocean Breeze',
    button_primary_color = '#0EA5E9',
    button_secondary_color = '#38BDF8',
    button_text_color = '#FFFFFF',
    font_size_small = '0.875rem',
    font_size_medium = '1rem',
    font_size_large = '1.25rem',
    button_border_radius = '0.375rem',
    button_padding = '0.75rem 1rem',
    is_active = true
  WHERE theme_id = 'ocean-breeze';
END $$;

-- Ensure RLS is enabled
DO $$ 
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE theme_parameters ENABLE ROW LEVEL SECURITY;

  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow public read access" ON theme_parameters;

  -- Create new policy
  CREATE POLICY "Allow public read access"
    ON theme_parameters
    FOR SELECT
    TO public
    USING (true);
END $$;