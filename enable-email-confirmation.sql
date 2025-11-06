-- Supabase 이메일 확인 재활성화
-- Supabase Dashboard > SQL Editor에서 실행

-- 이메일 확인 활성화
UPDATE auth.config 
SET enable_email_confirmations = true;

-- 확인
SELECT * FROM auth.config WHERE key = 'enable_email_confirmations';
