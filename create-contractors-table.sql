-- contractors 테이블 생성
-- 업체 전용 정보를 저장하는 테이블

CREATE TABLE public.contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  license_number VARCHAR(100),
  insurance_info TEXT,
  specialties JSONB DEFAULT '[]'::jsonb,
  years_experience INTEGER DEFAULT 0,
  portfolio_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약조건
  CONSTRAINT contractors_user_id_unique UNIQUE (user_id),
  CONSTRAINT contractors_rating_check CHECK (rating >= 0 AND rating <= 5.00),
  CONSTRAINT contractors_years_experience_check CHECK (years_experience >= 0)
);

-- 인덱스 생성
CREATE INDEX idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX idx_contractors_status ON public.contractors(status);
CREATE INDEX idx_contractors_rating ON public.contractors(rating);
CREATE INDEX idx_contractors_specialties ON public.contractors USING GIN(specialties);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_contractors_updated_at();

-- RLS 활성화
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 1. 업체는 자신의 정보를 조회/수정할 수 있음
CREATE POLICY "Contractors can view own data" ON public.contractors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Contractors can update own data" ON public.contractors
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. 관리자는 모든 업체 정보를 관리할 수 있음
CREATE POLICY "Admins can manage all contractors" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 3. 공개 정보는 모든 인증된 사용자가 조회 가능 (포트폴리오 등)
CREATE POLICY "Public contractor info viewable" ON public.contractors
  FOR SELECT USING (status = 'active');

-- 4. 새 업체 등록 (인증된 사용자만)
CREATE POLICY "Authenticated users can create contractor profile" ON public.contractors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 코멘트 추가
COMMENT ON TABLE public.contractors IS '업체 전용 정보를 저장하는 테이블';
COMMENT ON COLUMN public.contractors.user_id IS 'users 테이블의 사용자 ID (외래키)';
COMMENT ON COLUMN public.contractors.company_name IS '업체명';
COMMENT ON COLUMN public.contractors.contact_name IS '담당자명';
COMMENT ON COLUMN public.contractors.specialties IS '전문 분야 (JSON 배열)';
COMMENT ON COLUMN public.contractors.rating IS '평점 (0.00-5.00)';
COMMENT ON COLUMN public.contractors.status IS '업체 상태 (active, inactive, suspended)';
