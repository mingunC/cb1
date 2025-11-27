-- users 테이블에 preferred_language 컬럼 추가
-- 고객의 선호 언어를 저장하여 이메일 등에서 활용

-- 1. preferred_language 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- 2. 기존 사용자들의 기본값 설정
UPDATE users 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL;

-- 3. 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users(preferred_language);

-- 확인
SELECT 
  id,
  email,
  first_name,
  preferred_language
FROM users
LIMIT 5;
