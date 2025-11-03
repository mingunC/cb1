# 이메일 알림 설정 가이드 (한글)

## 📧 무엇이 바뀌나요?

### 1. 현장방문 신청 시 이메일 알림 ✨
업체가 현장방문을 신청하면 **고객에게 자동으로 이메일**이 발송됩니다.

### 2. 모든 이메일이 영어로 변경 🌐
기존 한글 이메일이 전문적인 영어 이메일로 변경됩니다.

## 🚀 설정 방법 (5단계)

### 1단계: 이메일 파일 교체

**교체할 파일:**
```
lib/email-service.ts
```

**방법 1: GitHub에서 직접 다운로드**
1. [이 링크](https://github.com/mingunC/cb1/blob/feature/site-visit-email-notifications/lib/email-service-english.ts)에서 파일 다운로드
2. 파일명을 `email-service.ts`로 변경
3. 프로젝트의 `lib/` 폴더에 있는 기존 파일 덮어쓰기

**방법 2: Git 명령어 사용**
```bash
cd /path/to/your/project
git fetch origin feature/site-visit-email-notifications
git checkout feature/site-visit-email-notifications -- lib/email-service-english.ts
mv lib/email-service-english.ts lib/email-service.ts
```

### 2단계: 현장방문 API 추가

**새로 만들 폴더:**
```
app/api/apply-site-visit/
```

**추가할 파일:**
```
app/api/apply-site-visit/route.ts
```

**방법 1: GitHub에서 직접 다운로드**
1. [이 링크](https://github.com/mingunC/cb1/blob/feature/site-visit-email-notifications/app/api/apply-site-visit/route.ts)에서 파일 다운로드
2. 프로젝트에 `app/api/apply-site-visit/` 폴더 생성
3. 다운로드한 파일을 해당 폴더에 `route.ts`로 저장

**방법 2: Git 명령어 사용**
```bash
git checkout feature/site-visit-email-notifications -- app/api/apply-site-visit/route.ts
```

### 3단계: 데이터베이스 테이블 확인

**이미 테이블이 있는지 확인:**

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. SQL Editor 클릭
3. 다음 명령어 실행:

```sql
SELECT * FROM site_visit_applications LIMIT 1;
```

**오류가 나면** (테이블이 없으면) 다음을 실행:

```sql
-- 현장방문 신청 테이블 생성
CREATE TABLE IF NOT EXISTS site_visit_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, contractor_id)
);

-- RLS 활성화
ALTER TABLE site_visit_applications ENABLE ROW LEVEL SECURITY;

-- 권한 설정
CREATE POLICY "업체는 자신의 신청을 볼 수 있음" ON site_visit_applications
FOR SELECT TO authenticated
USING (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "업체는 신청을 만들 수 있음" ON site_visit_applications
FOR INSERT TO authenticated
WITH CHECK (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "고객은 자신의 프로젝트 신청을 볼 수 있음" ON site_visit_applications
FOR SELECT TO authenticated
USING (project_id IN (SELECT id FROM quote_requests WHERE customer_id = auth.uid()));
```

### 4단계: Mailgun 설정 확인

프로젝트의 `.env.local` 파일에 다음 항목이 있는지 확인:

```bash
MAILGUN_API_KEY=key-xxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_DOMAIN_URL=https://api.mailgun.net
```

**이미 설정되어 있으면 그대로 사용하면 됩니다!**

유럽 리전을 사용 중이라면:
```bash
MAILGUN_DOMAIN_URL=https://api.eu.mailgun.net
```

### 5단계: 서버 재시작

**로컬 개발 환경:**
```bash
npm run dev
```

**Vercel 배포:**
```bash
vercel --prod
```

또는 Vercel Dashboard에서 재배포

## ✅ 테스트

### 테스트 1: 업체 선정 이메일 (영어 확인)

1. 고객 계정으로 로그인
2. 프로젝트에서 업체 선택
3. 업체 이메일함 확인
4. **이메일이 영어로 왔는지 확인** ✉️

### 테스트 2: 현장방문 신청 이메일 (새 기능)

1. 업체 계정으로 로그인
2. 프로젝트에서 "현장방문 신청" 클릭
3. 고객 이메일함 확인
4. **현장방문 신청 알림이 왔는지 확인** ✉️

## 📊 변경사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| **이메일 언어** | 한국어 | **영어** |
| **현장방문 알림** | ❌ 없음 | ✅ **추가됨** |
| **업체 선정 알림** | ✅ 한글 | ✅ **영어** |
| **화폐 단위** | KRW (₩) | USD ($) |
| **Mailgun 설정** | 그대로 유지 | 그대로 유지 |

## 🎨 이메일 예시

### 업체 선정 이메일 (업체에게 발송)

**제목:** 🎉 Congratulations! You have been selected for the project

**내용:**
- 축하 메시지
- 프로젝트 정보 (공간 타입, 위치, 견적 금액)
- 수수료 안내
- 다음 단계 안내
- 대시보드 링크

### 현장방문 신청 이메일 (고객에게 발송)

**제목:** 🏠 New Site Visit Application for Your Project

**내용:**
- 업체 정보 (회사명, 담당자, 전문 분야)
- 프로젝트 정보
- 신청 검토 안내
- 대시보드 링크

## 🔧 문제 해결

### 이메일이 발송되지 않아요

**1. Mailgun 설정 확인:**
```bash
# 터미널에서 확인
echo $MAILGUN_API_KEY
echo $MAILGUN_DOMAIN
```

**2. Mailgun 대시보드 확인:**
- https://app.mailgun.com 접속
- Sending → Logs 확인
- 이메일 발송 기록 확인

**3. 애플리케이션 로그 확인:**
```bash
# 로컬 개발
npm run dev
# 터미널에서 에러 메시지 확인

# Vercel 배포
vercel logs
```

### 여전히 한글로 나와요

**확인 사항:**
1. `lib/email-service.ts` 파일이 영어 버전으로 교체되었는지 확인
2. 서버를 재시작했는지 확인
3. 브라우저 캐시 삭제
4. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### 현장방문 신청 API가 작동하지 않아요

**확인 사항:**
1. `app/api/apply-site-visit/route.ts` 파일이 올바른 위치에 있는지 확인
2. 파일 맨 위의 import 문 확인:
   ```typescript
   import { sendEmail, createSiteVisitNotificationTemplate } from '@/lib/email-service'
   ```
3. 서버 재시작

### 테이블 생성 오류

**오류:** "relation already exists"
- 테이블이 이미 있다는 의미입니다
- 이 경우 3단계를 건너뛰셔도 됩니다

**오류:** "foreign key constraint"
- `quote_requests` 또는 `contractors` 테이블이 없는 경우
- 먼저 해당 테이블들이 생성되어 있는지 확인하세요

## 📁 파일 체크리스트

설정 완료 후 확인:

- [ ] `lib/email-service.ts` - 영어 버전으로 교체됨
- [ ] `app/api/apply-site-visit/route.ts` - 새로 생성됨
- [ ] `site_visit_applications` 테이블 - Supabase에 생성됨
- [ ] `.env.local` - Mailgun 설정 확인됨
- [ ] 서버 재시작됨
- [ ] 업체 선정 이메일 테스트 완료 (영어)
- [ ] 현장방문 신청 이메일 테스트 완료

## 📚 추가 문서

- [SIMPLE-SETUP-GUIDE.md](https://github.com/mingunC/cb1/blob/feature/site-visit-email-notifications/SIMPLE-SETUP-GUIDE.md) - 영문 간단 가이드
- [MAILGUN-SETUP-GUIDE.md](https://github.com/mingunC/cb1/blob/feature/site-visit-email-notifications/MAILGUN-SETUP-GUIDE.md) - Mailgun 상세 가이드
- [Pull Request #4](https://github.com/mingunC/cb1/pull/4) - 전체 변경사항

## 💡 팁

### Mailgun 무료 플랜
- 월 5,000개 이메일 무료
- 개발/테스트에 충분
- 프로덕션에서도 사용 가능

### 이메일 전달률 향상
- SPF/DKIM 레코드 설정
- 도메인 인증 완료
- Mailgun에서 "Verified" 상태 확인

### 이메일 로그 확인
- Mailgun Dashboard에서 실시간 확인 가능
- 전달 실패 시 이유 확인 가능
- 오픈율, 클릭률 추적 가능

## 🆘 도움이 필요하신가요?

1. [GitHub Issue](https://github.com/mingunC/cb1/issues) 생성
2. [Pull Request](https://github.com/mingunC/cb1/pull/4)에 댓글
3. Mailgun 지원팀 문의: https://help.mailgun.com

---

**마지막 업데이트:** 2025년 11월  
**작성자:** 개발팀  
**브랜치:** `feature/site-visit-email-notifications`  

## ✅ 완료!

설정이 완료되면:
- ✅ 업체 선정 시 영어 이메일 자동 발송
- ✅ 현장방문 신청 시 고객에게 알림 발송
- ✅ 전문적인 이메일 템플릿
- ✅ 기존 Mailgun 설정 그대로 사용

모든 설정이 완료되었습니다! 🎉
