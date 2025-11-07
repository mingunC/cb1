-- 이메일로 가입한 사용자의 이름 설정
-- devryan.choi@... 이메일을 가진 사용자 찾기 및 이름 설정

-- 1. 먼저 해당 이메일 주소를 가진 사용자 확인
SELECT id, email, first_name, last_name, user_type
FROM users
WHERE email LIKE 'devryan.choi%';

-- 2. 이름 업데이트 (실제 이름으로 변경해주세요)
-- UPDATE users
-- SET 
--   first_name = 'Ryan',  -- 원하는 이름으로 변경
--   last_name = 'Choi'    -- 원하는 성으로 변경
-- WHERE email LIKE 'devryan.choi%';

-- 3. 업데이트 확인
-- SELECT id, email, first_name, last_name, user_type
-- FROM users
-- WHERE email LIKE 'devryan.choi%';
