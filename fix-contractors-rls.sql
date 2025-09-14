-- contractors 테이블에 대한 공개 읽기 정책 추가
-- 인증되지 않은 사용자도 업체 목록을 볼 수 있도록 설정

-- 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'contractors';

-- 공개 읽기 정책 추가 (모든 사용자가 업체 목록을 볼 수 있음)
CREATE POLICY "Anyone can view contractors" ON contractors
FOR SELECT
TO public
USING (true);

-- 정책이 제대로 생성되었는지 확인
SELECT * FROM pg_policies WHERE tablename = 'contractors';

-- 테스트: contractors 테이블에서 데이터 조회
SELECT id, company_name, contact_name, status FROM contractors LIMIT 5;