-- 기존 사용자 mystars100826@gmail.com을 위한 프로필 생성
-- Supabase SQL Editor에서 실행

-- 먼저 users 테이블이 있는지 확인하고 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  postal_code TEXT,
  address TEXT,
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- mystars100826@gmail.com 사용자의 프로필 생성
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
WHERE email = 'mystars100826@gmail.com'
ON CONFLICT (id) DO NOTHING;
