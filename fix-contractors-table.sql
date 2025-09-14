-- contractors 테이블 구조 확인

-- 1. contractors 테이블의 컬럼 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contractors' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 현재 contractors 테이블 데이터 확인
SELECT * FROM public.contractors LIMIT 5;

-- 3. contractors 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  bio TEXT,
  website TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  service_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS 활성화
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
CREATE POLICY "Anyone can view active contractors" ON public.contractors
FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Contractors can manage their own profile" ON public.contractors
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all contractors" ON public.contractors
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_is_active ON public.contractors(is_active);
CREATE INDEX IF NOT EXISTS idx_contractors_is_verified ON public.contractors(is_verified);
CREATE INDEX IF NOT EXISTS idx_contractors_created_at ON public.contractors(created_at);
