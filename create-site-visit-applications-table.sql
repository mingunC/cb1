-- site_visit_applications 테이블 생성 (현장방문 신청 테이블)
CREATE TABLE IF NOT EXISTS site_visit_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, contractor_id) -- 한 업체당 한 프로젝트에 한 번만 신청 가능
);

-- RLS 활성화
ALTER TABLE site_visit_applications ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 업체는 자신의 현장방문 신청을 볼 수 있음
CREATE POLICY "Contractors can view their own site visit applications" ON site_visit_applications
FOR SELECT
TO authenticated
USING (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
));

-- 업체는 현장방문 신청을 할 수 있음
CREATE POLICY "Contractors can create site visit applications" ON site_visit_applications
FOR INSERT
TO authenticated
WITH CHECK (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
));

-- 관리자는 모든 현장방문 신청을 볼 수 있음
CREATE POLICY "Admins can view all site visit applications" ON site_visit_applications
FOR SELECT
TO authenticated
USING (
    auth.jwt() ->> 'email' IN (
        'cmgg919@gmail.com',
        'mingun.ryan.choi@gmail.com'
    )
);

-- 관리자는 현장방문 신청을 승인/거절할 수 있음
CREATE POLICY "Admins can update site visit applications" ON site_visit_applications
FOR UPDATE
TO authenticated
USING (
    auth.jwt() ->> 'email' IN (
        'cmgg919@gmail.com',
        'mingun.ryan.choi@gmail.com'
    )
)
WITH CHECK (
    auth.jwt() ->> 'email' IN (
        'cmgg919@gmail.com',
        'mingun.ryan.choi@gmail.com'
    )
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_site_visit_applications_project_id ON site_visit_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_site_visit_applications_contractor_id ON site_visit_applications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_site_visit_applications_status ON site_visit_applications(status);

-- 테이블 확인
SELECT * FROM site_visit_applications LIMIT 5;