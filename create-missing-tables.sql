-- ============================================
-- 누락된 테이블만 생성 (기존 테이블 구조와 호환)
-- ============================================

-- 1. profiles 테이블 생성 (users 테이블과 별도로 프로필 정보 저장)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('customer', 'contractor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. projects 테이블 생성 (quote_requests 테이블과 유사하지만 더 상세한 프로젝트 정보)
-- quote_requests가 이미 있으므로, projects는 실제 진행중인 프로젝트용으로 사용
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_request_id UUID REFERENCES quote_requests(id), -- 견적 요청과 연결
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  contractor_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
  project_type TEXT,
  final_budget DECIMAL(10, 2),
  contract_date DATE,
  start_date DATE,
  end_date DATE,
  completion_date DATE,
  address TEXT,
  city TEXT,
  district TEXT,
  progress_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. messages 테이블 생성 (채팅/메시지)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. notifications 테이블 생성 (알림)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'new_quote_request',
    'new_quote',
    'quote_accepted',
    'quote_rejected',
    'new_message',
    'project_update',
    'review_received',
    'payment_received',
    'other'
  )),
  title TEXT NOT NULL,
  content TEXT,
  related_id UUID, -- 관련 프로젝트/견적/메시지 ID
  related_type TEXT, -- 'project', 'quote', 'message', etc.
  is_read BOOLEAN DEFAULT false,
  action_url TEXT, -- 클릭 시 이동할 URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- profiles 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- projects 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_quote_request_id ON projects(quote_request_id);

-- messages 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_quote_request_id ON messages(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- RLS (Row Level Security) 활성화
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 정책 설정
-- ============================================

-- profiles 정책
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- projects 정책
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = contractor_id
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = contractor_id
  );

CREATE POLICY "Project participants can update projects" ON projects
  FOR UPDATE USING (
    auth.uid() = customer_id OR auth.uid() = contractor_id
  );

-- messages 정책
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- notifications 정책
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 트리거 함수: updated_at 자동 업데이트
-- ============================================

-- 트리거 함수가 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 새 사용자 생성 시 자동으로 profile 생성
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
  )
  ON CONFLICT (id) DO NOTHING; -- 이미 존재하는 경우 무시
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 없으면 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 기존 사용자에 대한 profile 생성 (이미 가입한 사용자들)
-- ============================================

-- 기존 auth.users에 있지만 profiles에 없는 사용자들의 프로필 생성
INSERT INTO profiles (id, email, full_name, user_type)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  CASE 
    WHEN id IN (SELECT user_id FROM contractors) THEN 'contractor'
    ELSE 'customer'
  END
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 뷰(View) 생성: 프로젝트와 견적 요청 통합 조회
-- ============================================

CREATE OR REPLACE VIEW project_overview AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.status,
  p.customer_id,
  c_profile.full_name as customer_name,
  c_profile.email as customer_email,
  p.contractor_id,
  contractor_profile.full_name as contractor_name,
  contractors.company_name as contractor_company,
  p.final_budget,
  p.start_date,
  p.end_date,
  p.progress_percentage,
  p.created_at,
  p.updated_at,
  qr.id as quote_request_id,
  qr.status as quote_request_status
FROM projects p
LEFT JOIN profiles c_profile ON p.customer_id = c_profile.id
LEFT JOIN profiles contractor_profile ON p.contractor_id = contractor_profile.id
LEFT JOIN contractors ON contractors.user_id = p.contractor_id
LEFT JOIN quote_requests qr ON p.quote_request_id = qr.id;

-- ============================================
-- 완료 메시지
-- ============================================
SELECT 
    '✅ 누락된 테이블 생성 완료!' as message,
    'profiles, projects, messages, notifications 테이블이 생성되었습니다.' as detail;

-- ============================================
-- 생성 후 확인
-- ============================================
SELECT 
    'profiles' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as exists
UNION ALL
SELECT 
    'projects' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') as exists
UNION ALL
SELECT 
    'messages' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') as exists
UNION ALL
SELECT 
    'notifications' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') as exists;
