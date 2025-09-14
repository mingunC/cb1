-- portfolios 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true, -- 공개 버킷 (승인된 포트폴리오는 공개)
  5242880, -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- portfolios 버킷 정책 설정
-- 업체는 자신의 포트폴리오 이미지만 업로드 가능
CREATE POLICY "Contractors can upload their own portfolio images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 업체는 자신의 포트폴리오 이미지만 조회 가능
CREATE POLICY "Contractors can view their own portfolio images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 공개 포트폴리오 이미지는 모든 사용자가 조회 가능
CREATE POLICY "Public can view approved portfolio images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'portfolios' 
  AND EXISTS (
    SELECT 1 FROM portfolios p
    WHERE p.status = 'approved'
    AND (
      p.images @> ARRAY[storage.objects.name] OR
      p.before_images @> ARRAY[storage.objects.name] OR
      p.after_images @> ARRAY[storage.objects.name]
    )
  )
);

-- 관리자는 모든 포트폴리오 이미지 조회 가능
CREATE POLICY "Admins can view all portfolio images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'portfolios' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'admin'
  )
);
