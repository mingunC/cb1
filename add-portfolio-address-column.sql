-- portfolios 테이블에 프로젝트 주소 컬럼 추가
-- 프로젝트 위치 정보를 저장하기 위한 컬럼

-- 1. portfolios 테이블에 project_address 컬럼 추가
ALTER TABLE public.portfolios
ADD COLUMN IF NOT EXISTS project_address TEXT;

-- 2. 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN public.portfolios.project_address IS '프로젝트 주소 정보';

-- 3. 인덱스 생성 (선택사항 - 주소 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_portfolios_project_address ON public.portfolios(project_address);

-- 4. 기존 데이터 확인 (선택사항)
-- SELECT id, title, project_address FROM public.portfolios WHERE project_address IS NOT NULL;
