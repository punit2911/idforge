-- Create storage bucket for user photos (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own photos
CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add photo_url column to saved_designs table
ALTER TABLE public.saved_designs 
ADD COLUMN IF NOT EXISTS user_photo_url text;