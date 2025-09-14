-- contractor-quotes 버킷 확인 및 정책 업데이트
-- 버킷이 이미 존재하는 경우 정책만 업데이트

-- 기존 버킷 확인
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'contractor-quotes';

-- 버킷이 없다면 생성 (이미 있다면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor-quotes',
  'contractor-quotes', 
  true,
  10485760,  -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can upload contractor quotes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view contractor quotes" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete their own quotes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all contractor quotes" ON storage.objects;

-- RLS 정책 재생성
CREATE POLICY "Authenticated users can upload contractor quotes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contractor-quotes');

CREATE POLICY "Authenticated users can view contractor quotes" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'contractor-quotes');

CREATE POLICY "Contractors can delete their own quotes" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contractor-quotes' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Admins can manage all contractor quotes" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'contractor-quotes'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- 최종 확인
SELECT 'contractor-quotes bucket and policies updated successfully' as status;
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'contractor-quotes';
