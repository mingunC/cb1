-- contractors 테이블에 프로필 페이지에서 사용하는 컬럼들 추가

-- 1. 현재 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors'
ORDER BY ordinal_position;

-- 2. 누락된 컬럼들 추가
-- company_logo
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- description (회사 소개)
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS description TEXT;

-- website
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS website TEXT;

-- years_in_business (기존 years_experience와 다름)
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS years_in_business INTEGER DEFAULT 0;

-- insurance (기존 insurance_info와 다름)
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS insurance TEXT;

-- 3. 기존 데이터 마이그레이션 (선택사항)
-- insurance_info 데이터가 있으면 insurance로 복사
UPDATE contractors
SET insurance = insurance_info
WHERE insurance IS NULL AND insurance_info IS NOT NULL;

-- years_experience 데이터가 있으면 years_in_business로 복사
UPDATE contractors
SET years_in_business = years_experience
WHERE years_in_business = 0 AND years_experience > 0;

-- 4. 추가된 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors'
  AND column_name IN ('company_logo', 'description', 'website', 'years_in_business', 'insurance')
ORDER BY column_name;

-- 5. 인덱스 추가 (선택사항, 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_contractors_company_logo 
ON contractors(company_logo) 
WHERE company_logo IS NOT NULL;

-- 6. 코멘트 추가
COMMENT ON COLUMN contractors.company_logo IS '회사 로고 이미지 URL';
COMMENT ON COLUMN contractors.description IS '회사 소개';
COMMENT ON COLUMN contractors.website IS '회사 웹사이트 URL';
COMMENT ON COLUMN contractors.years_in_business IS '사업 경력 (년)';
COMMENT ON COLUMN contractors.insurance IS '보험 정보';

-- 완료 메시지
SELECT 
  'contractors 테이블 업데이트 완료!' as message,
  COUNT(*) FILTER (WHERE column_name = 'company_logo') as company_logo_added,
  COUNT(*) FILTER (WHERE column_name = 'description') as description_added,
  COUNT(*) FILTER (WHERE column_name = 'website') as website_added,
  COUNT(*) FILTER (WHERE column_name = 'years_in_business') as years_in_business_added,
  COUNT(*) FILTER (WHERE column_name = 'insurance') as insurance_added
FROM information_schema.columns
WHERE table_name = 'contractors'
  AND column_name IN ('company_logo', 'description', 'website', 'years_in_business', 'insurance');
