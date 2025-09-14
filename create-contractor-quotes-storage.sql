-- contractor-quotes 스토리지 버킷 생성
-- 업체가 제출한 견적서 PDF 파일을 저장하는 버킷

-- 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor-quotes',
  'contractor-quotes', 
  true,  -- 공개 버킷 (견적서는 고객이 다운로드해야 함)
  10485760,  -- 10MB 제한 (10 * 1024 * 1024)
  ARRAY['application/pdf']  -- PDF 파일만 허용
);

-- RLS 정책 설정
-- 1. 인증된 사용자는 파일 업로드 가능
CREATE POLICY "Authenticated users can upload contractor quotes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contractor-quotes');

-- 2. 인증된 사용자는 파일 읽기 가능 (고객이 견적서 다운로드)
CREATE POLICY "Authenticated users can view contractor quotes" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'contractor-quotes');

-- 3. 업체는 자신이 업로드한 파일만 삭제 가능
CREATE POLICY "Contractors can delete their own quotes" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contractor-quotes' 
  AND auth.uid()::text = (storage.foldername(name))[2]  -- 파일명에서 contractor_id 추출
);

-- 4. 관리자는 모든 파일 관리 가능
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

-- 버킷 생성 확인
SELECT * FROM storage.buckets WHERE id = 'contractor-quotes';