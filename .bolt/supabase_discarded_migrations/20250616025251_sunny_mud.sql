/*
  # Create Storage Bucket for File Uploads

  ## Summary
  Creates the default storage bucket for file uploads in the DoctorSoft application.

  ## 1. Storage Bucket
  - Creates '00000000-default-bucket' bucket
  - Configures public access for file viewing
  - Sets up proper permissions

  ## 2. Security
  - RLS policies for authenticated users
  - User-specific folder access
  - File size and type restrictions
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '00000000-default-bucket',
  '00000000-default-bucket',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload files to their own folders
CREATE POLICY "Users can upload files to their own folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '00000000-default-bucket' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can view files in their own folders
CREATE POLICY "Users can view files in their own folders"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = '00000000-default-bucket' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can update files in their own folders
CREATE POLICY "Users can update files in their own folders"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = '00000000-default-bucket' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can delete files in their own folders
CREATE POLICY "Users can delete files in their own folders"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = '00000000-default-bucket' AND
  (storage.foldername(name))[1] = 'uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow public access to view files (for file URLs)
CREATE POLICY "Allow public access to view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = '00000000-default-bucket');