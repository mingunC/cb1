-- Supabase 이메일 확인 비활성화 SQL
-- Supabase SQL Editor에서 실행

-- 이메일 확인 비활성화
UPDATE auth.config 
SET enable_signup = true,
    enable_email_confirmations = false;

-- 또는 직접 설정 테이블 업데이트 (Supabase 버전에 따라 다를 수 있음)
-- INSERT INTO auth.config (key, value) 
-- VALUES ('enable_email_confirmations', 'false')
-- ON CONFLICT (key) DO UPDATE SET value = 'false';
