-- contractors 테이블에 profile_image 컬럼 추가
-- 업체가 프로필 이미지를 업로드할 수 있도록 함

ALTER TABLE public.contractors 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

COMMENT ON COLUMN public.contractors.profile_image IS '업체 프로필 이미지 URL';
