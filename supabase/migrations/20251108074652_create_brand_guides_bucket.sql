/*
  # Create Brand Guides Bucket
  
  Creates a Supabase Storage bucket for brand assets and branding guidelines.
  
  1. Bucket: brand-guides
     - Public read access enabled
     - Write access via service role only
     - Stores JSON branding guides, logo assets, color palettes
  
  2. Security
     - Public can read (download) from bucket
     - Only service role can upload/update
     - Prevents unauthorized brand asset modifications
*/

-- Create the brand-guides bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-guides',
  'brand-guides',
  true,
  5242880, -- 5MB limit
  ARRAY['application/json', 'image/svg+xml', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Policy: Allow public reads
CREATE POLICY "Public can read brand guides"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-guides');

-- Policy: Only service role can insert
CREATE POLICY "Service role can upload brand guides"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'brand-guides');

-- Policy: Only service role can update
CREATE POLICY "Service role can update brand guides"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'brand-guides')
WITH CHECK (bucket_id = 'brand-guides');

-- Policy: Only service role can delete
CREATE POLICY "Service role can delete brand guides"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'brand-guides');
