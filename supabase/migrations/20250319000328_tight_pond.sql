/*
  # Update Theme Parameters

  1. Changes
    - Add new themes if they don't exist
    - Update existing themes if they do exist
    - Ensure RLS is enabled
    - Add public read access policy

  2. Schema Updates
    - Safe insertion of theme data
    - Proper error handling for duplicates
*/

-- Function to safely upsert theme parameters
DO $$ 
BEGIN
  -- Insert or update Forest Night theme
  IF EXISTS (SELECT 1 FROM theme_parameters WHERE theme_id = 'forest-night') THEN
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
  ELSE
    INSERT INTO theme_parameters 
    (theme_id, theme_name, button_primary_color, button_secondary_color, button_text_color, 
     font_size_small, font_size_medium, font_size_large, button_border_radius, button_padding)
    VALUES
    ('forest-night', 'Forest Night', '#2D3B2D', '#4A5D4A', '#FFFFFF', 
     '0.875rem', '1rem', '1.25rem', '0.375rem', '0.75rem 1rem');
  END IF;

  -- Insert or update Ocean Breeze theme
  IF EXISTS (SELECT 1 FROM theme_parameters WHERE theme_id = 'ocean-breeze') THEN
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
  ELSE
    INSERT INTO theme_parameters 
    (theme_id, theme_name, button_primary_color, button_secondary_color, button_text_color, 
     font_size_small, font_size_medium, font_size_large, button_border_radius, button_padding)
    VALUES
    ('ocean-breeze', 'Ocean Breeze', '#0EA5E9', '#38BDF8', '#FFFFFF',
     '0.875rem', '1rem', '1.25rem', '0.375rem', '0.75rem 1rem');
  END IF;
END $$;

-- Ensure RLS is enabled and policy exists
DO $$ 
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE theme_parameters ENABLE ROW LEVEL SECURITY;

  -- Create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'theme_parameters' 
    AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON theme_parameters
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;