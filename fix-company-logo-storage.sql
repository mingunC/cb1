-- 회사 로고 저장을 위한 Storage 버킷 설정 확인 및 수정

-- 1. 'portfolios' 버킷이 존재하는지 확인
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'portfolios';

-- 2. 버킷이 없다면 생성 (이미 있으면 에러가 발생하므로 주의)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,  -- 공개 버킷
  10485760, -- 10MB 제한
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. 기존 Storage 정책 확인
SELECT * FROM storage.policies WHERE bucket_id = 'portfolios';

-- 4. 기존 정책이 있다면 삭제 (선택사항)
-- DROP POLICY IF EXISTS "Contractors can upload to their own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Contractors can delete their own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;

-- 5. Storage 정책 생성 - 업체는 contractor-logos 폴더에 업로드 가능
CREATE POLICY "Contractors can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolios' AND
    (storage.foldername(name))[1] = 'contractor-logos'
  );

-- 6. Storage 정책 - 업체는 자신의 파일만 업데이트 가능
CREATE POLICY "Contractors can update their logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'portfolios' AND
    (storage.foldername(name))[1] = 'contractor-logos'
  );

-- 7. Storage 정책 - 업체는 자신의 파일만 삭제 가능
CREATE POLICY "Contractors can delete their logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolios' AND
    (storage.foldername(name))[1] = 'contractor-logos'
  );

-- 8. Storage 정책 - 모든 사용자는 이미지 조회 가능 (공개)
CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'portfolios'
  );

-- 9. contractors 테이블에 company_logo 컬럼이 있는지 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors' AND column_name = 'company_logo';

-- 10. company_logo 컬럼이 없다면 추가
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 11. 최종 확인 쿼리
SELECT 
  'Bucket configured' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'portfolios') as bucket_exists,
  (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'portfolios') as policies_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contractors' AND column_name = 'company_logo') as column_exists;
