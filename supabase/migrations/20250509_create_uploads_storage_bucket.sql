-- Create a new storage bucket called 'uploads'
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Create a policy to allow public read access to the uploads bucket
CREATE POLICY "Allow public read access to uploads bucket" ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads'::text);

-- Create a policy to allow authenticated users to upload files to the uploads bucket
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT
-- TO authenticated
WITH CHECK (bucket_id = 'uploads'::text);

-- Create a policy to allow users to update their own uploads
CREATE POLICY "Allow users to update their own uploads" ON storage.objects
FOR UPDATE
WITH CHECK (bucket_id = 'uploads'::text);


-- Create a policy to allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own uploads" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads'::text AND auth.uid() = owner); 