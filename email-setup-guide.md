# 업체 선택 자동 이메일 발송 설정 가이드

## 📧 구현된 기능

고객이 업체를 선택하면 자동으로 선택된 업체에게 축하 이메일이 발송됩니다.

### 이메일 내용:
- 🎉 축하 메시지
- 📋 프로젝트 정보 (공간 유형, 예산, 주소, 견적 금액)
- 💰 수수료 입금 안내
- 📞 고객 정보 전달 절차 안내

## 🚀 설정 방법

### 1. Supabase Database Function 설정

```sql
-- send-contractor-selection-email.sql 파일의 내용을 Supabase SQL Editor에서 실행
```

### 2. Supabase Edge Functions 배포

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 프로젝트 로그인
supabase login

# 3. 프로젝트 연결
supabase link --project-ref your-project-id

# 4. Edge Functions 폴더 구조 생성
mkdir -p supabase/functions/send-email
mkdir -p supabase/functions/_shared

# 5. 파일 복사
cp supabase-email-function.js supabase/functions/send-email/index.ts
cp supabase-cors.ts supabase/functions/_shared/cors.ts

# 6. Edge Function 배포
supabase functions deploy send-email
```

### 3. 환경 변수 설정

```bash
# Resend API 키 설정 (이메일 서비스)
supabase secrets set RESEND_API_KEY=your_resend_api_key

# 발송자 이메일 설정
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

### 4. Resend 서비스 설정

1. [Resend](https://resend.com) 가입
2. API 키 생성
3. 도메인 인증 (선택사항)

## 🔧 테스트 방법

1. 고객이 업체를 선택 (`handleSelectContractor` 함수 실행)
2. `contractor_quotes` 테이블의 `status`가 `accepted`로 변경
3. 트리거가 자동으로 실행되어 이메일 발송

## 📝 커스터마이징

### 이메일 내용 수정
`send-contractor-selection-email.sql` 파일의 `email_content` 변수를 수정

### 수수료 정보 변경
이메일 템플릿에서 계좌 정보와 수수료율 수정

### 추가 기능
- SMS 알림 추가
- 슬랙 알림 연동
- 이메일 발송 로그 저장

## ⚠️ 주의사항

1. **환경 변수 보안**: API 키는 절대 코드에 하드코딩하지 마세요
2. **이메일 발송 제한**: Resend의 발송 제한을 확인하세요
3. **스팸 방지**: 도메인 인증을 통해 이메일 전달률을 높이세요
4. **에러 처리**: 이메일 발송 실패 시 재시도 로직 고려

## 🔍 문제 해결

### Edge Function 로그 확인
```bash
supabase functions logs send-email
```

### Database Function 디버깅
```sql
-- 트리거 실행 여부 확인
SELECT * FROM pg_stat_user_functions WHERE funcname = 'send_contractor_selection_email';
```

### 이메일 발송 상태 확인
Resend 대시보드에서 이메일 발송 상태를 모니터링할 수 있습니다.
