-- 포트폴리오 이미지 저장을 위한 Supabase Storage 버킷 생성
-- 이 스크립트는 Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. portfolio-images 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true,
  10485760, -- 10MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. 포트폴리오 프로젝트 테이블 생성
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('주거공간', '상업공간')),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 정책 설정
-- 업체는 자신의 포트폴리오만 관리할 수 있음
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- 업체는 자신의 포트폴리오를 조회, 생성, 수정, 삭제할 수 있음
CREATE POLICY "Contractors can manage their own portfolio" ON portfolio_projects
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- 모든 사용자는 포트폴리오를 조회할 수 있음 (공개)
CREATE POLICY "Anyone can view portfolio projects" ON portfolio_projects
  FOR SELECT USING (true);

-- 4. 스토리지 정책 설정
-- 업체는 자신의 폴더에만 파일을 업로드할 수 있음
CREATE POLICY "Contractors can upload to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 업체는 자신의 파일만 삭제할 수 있음
CREATE POLICY "Contractors can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 모든 사용자는 포트폴리오 이미지를 조회할 수 있음
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_contractor_id ON portfolio_projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_category ON portfolio_projects(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_year ON portfolio_projects(year);

-- 6. 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_portfolio_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_projects_updated_at();

-- 완료 메시지
SELECT 'Portfolio storage bucket and table created successfully!' as message;
