-- 고객 프로필 테이블 생성
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_postal_code ON users(postal_code);

-- RLS 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정할 수 있음
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 관리자는 모든 프로필을 볼 수 있음
CREATE POLICY "Admins can view all profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$;

-- 트리거 생성: 새 사용자 가입 시 자동으로 프로필 생성
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 기존 사용자들을 위한 프로필 생성
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
