/*
  # Create Theme Parameters Table

  1. New Tables
    - `theme_parameters`
      - Stores theme configuration
      - Includes color schemes and typography settings
      - Tracks active themes

  2. Schema Updates
    - Primary key constraint on theme_id
    - Timestamp tracking
    - Active theme flag
*/

CREATE TABLE IF NOT EXISTS theme_parameters (
  theme_id text PRIMARY KEY,
  theme_name text NOT NULL,
  button_primary_color text NOT NULL,
  button_secondary_color text NOT NULL,
  button_text_color text NOT NULL,
  font_size_small text NOT NULL,
  font_size_medium text NOT NULL,
  font_size_large text NOT NULL,
  button_border_radius text NOT NULL,
  button_padding text NOT NULL,
  timestamp_created timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Insert default themes
INSERT INTO theme_parameters 
(theme_id, theme_name, button_primary_color, button_secondary_color, button_text_color, 
 font_size_small, font_size_medium, font_size_large, button_border_radius, button_padding)
VALUES
('forest-night', 'Forest Night', '#2D3B2D', '#4A5D4A', '#FFFFFF', 
 '0.875rem', '1rem', '1.25rem', '0.375rem', '0.75rem 1rem'),
('ocean-breeze', 'Ocean Breeze', '#0EA5E9', '#38BDF8', '#FFFFFF',
 '0.875rem', '1rem', '1.25rem', '0.375rem', '0.75rem 1rem');

-- Enable RLS
ALTER TABLE theme_parameters ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON theme_parameters
  FOR SELECT
  TO public
  USING (true);