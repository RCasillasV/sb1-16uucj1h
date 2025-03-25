-- Function to safely update theme parameters
DO $$ 
BEGIN
  -- Insert or update Sunset Orange theme
  INSERT INTO theme_parameters 
  (theme_id, theme_name, button_primary_color, button_secondary_color, button_text_color, 
   font_size_small, font_size_medium, font_size_large, button_border_radius, button_padding)
  VALUES
  ('sunset-orange', 'Sunset Orange', '#EA580C', '#F97316', '#FFFFFF',
   '0.875rem', '1rem', '1.25rem', '9999px', '0.75rem 1rem')
  ON CONFLICT (theme_id) DO UPDATE
  SET 
    theme_name = 'Sunset Orange',
    button_primary_color = '#EA580C',
    button_secondary_color = '#F97316',
    button_text_color = '#FFFFFF',
    font_size_small = '0.875rem',
    font_size_medium = '1rem',
    font_size_large = '1.25rem',
    button_border_radius = '9999px',
    button_padding = '0.75rem 1rem',
    is_active = true;

  -- Insert or update Forest Green theme
  INSERT INTO theme_parameters 
  (theme_id, theme_name, button_primary_color, button_secondary_color, button_text_color, 
   font_size_small, font_size_medium, font_size_large, button_border_radius, button_padding)
  VALUES
  ('forest-green', 'Forest Green', '#166534', '#15803D', '#FFFFFF',
   '0.875rem', '1rem', '1.25rem', '0.5rem', '0.75rem 1rem')
  ON CONFLICT (theme_id) DO UPDATE
  SET 
    theme_name = 'Forest Green',
    button_primary_color = '#166534',
    button_secondary_color = '#15803D',
    button_text_color = '#FFFFFF',
    font_size_small = '0.875rem',
    font_size_medium = '1rem',
    font_size_large = '1.25rem',
    button_border_radius = '0.5rem',
    button_padding = '0.75rem 1rem',
    is_active = true;
END $$;