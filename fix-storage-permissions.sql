-- Supabase Storage 권한 설정 (portfolio-images 버킷)

-- 1. 현재 스토리지 정책 확인
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- 3. 새로운 정책 생성 (더 단순하고 명확하게)

-- 누구나 볼 수 있음
CREATE POLICY "Public can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

-- 인증된 사용자는 업로드 가능
CREATE POLICY "Authenticated users can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images' AND
  auth.role() = 'authenticated'
);

-- 인증된 사용자는 자신의 폴더에 업데이트 가능
CREATE POLICY "Authenticated users can update own portfolio images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-images' AND
  auth.role() = 'authenticated'
);

-- 인증된 사용자는 자신의 폴더에서 삭제 가능
CREATE POLICY "Authenticated users can delete own portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-images' AND
  auth.role() = 'authenticated'
);

-- 4. 버킷이 public인지 확인
UPDATE storage.buckets
SET public = true
WHERE id = 'portfolio-images';

-- 5. 버킷 확인
SELECT id, name, public
FROM storage.buckets
WHERE id = 'portfolio-images';

-- 6. 정책 확인
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as action
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%portfolio%'
ORDER BY cmd;

SELECT '✅ Storage policies updated! Try uploading again.' as result;
