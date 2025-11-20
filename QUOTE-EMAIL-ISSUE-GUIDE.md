# 견적서 제출 시 고객 이메일 발송 문제 해결 가이드

## 문제 상황
업체가 bidding에서 견적서를 제출했는데 고객에게 이메일이 발송되지 않는 문제

## 원인 분석

### 1. 코드 흐름
```
견적서 제출 (POST /api/quotes/submit)
  ↓
contractor_quotes 테이블에 저장 ✅
  ↓
quote_requests 테이블에서 프로젝트 정보 + customer_id 조회
  ↓
users 테이블에서 고객 이메일 조회 ⚠️
  ↓
contractors 테이블에서 업체 정보 조회
  ↓
Mailgun으로 이메일 발송 📧
```

### 2. 잠재적 문제점

#### A. 고객 이메일 정보 누락
- `quote_requests.customer_id`가 NULL
- `users` 테이블에 해당 고객이 없음
- `users.email`이 NULL 또는 빈 문자열

#### B. Mailgun 설정 문제
- 환경 변수 누락: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`
- Mailgun API 키가 유효하지 않음
- 도메인이 Mailgun에 제대로 설정되지 않음

#### C. 데이터베이스 권한 문제
- Service role key로 users 테이블 조회 실패
- RLS 정책으로 인한 접근 제한

## 진단 방법

### 1단계: 데이터베이스 확인
`diagnose-quote-email-issue.sql` 파일을 실행하여:
- 최근 제출된 견적서 확인
- 고객 이메일 정보 확인
- 고객 이메일이 없는 프로젝트 찾기

```sql
-- Supabase SQL Editor에서 실행
-- 파일: diagnose-quote-email-issue.sql
```

### 2단계: 로그 확인
애플리케이션 로그에서 다음 메시지 확인:
```
📧 Starting email notification process...
👤 Customer email retrieved: [email]
❌ Customer fetch error: [error]
❌ EMAIL PROCESS ERROR: [error]
```

### 3단계: 환경 변수 확인
`.env.local` 또는 Vercel 환경 변수에서 확인:
```bash
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_DOMAIN_URL=https://api.mailgun.net
EMAIL_FROM_NAME=Canada Beaver
EMAIL_FROM_ADDRESS=noreply@canadabeaver.pro
EMAIL_REPLY_TO=support@canadabeaver.pro
```

## 해결 방법

### 해결책 1: 고객 이메일 정보 수정

#### A. customer_id가 NULL인 경우
```sql
-- 올바른 customer_id로 업데이트
UPDATE quote_requests
SET customer_id = '[올바른 user_id]'
WHERE id = '[project_id]' AND customer_id IS NULL;
```

#### B. 고객 이메일이 없는 경우
```sql
-- 고객 이메일 추가
UPDATE users
SET email = '[고객_이메일]'
WHERE id = '[customer_id]' AND (email IS NULL OR email = '');
```

### 해결책 2: Mailgun 재설정

#### A. 환경 변수 확인 및 재설정
```bash
# .env.local 파일 또는 Vercel 대시보드에서 설정
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.canadabeaver.pro
MAILGUN_DOMAIN_URL=https://api.mailgun.net
EMAIL_FROM_NAME=Canada Beaver
EMAIL_FROM_ADDRESS=noreply@canadabeaver.pro
```

#### B. Mailgun 테스트
```bash
# API 엔드포인트 호출
curl -X GET https://api.mailgun.net/v3/domains/mg.canadabeaver.pro \
  -u "api:your-api-key"
```

### 해결책 3: 이메일 재발송 API 생성

현재 견적서는 저장되었지만 이메일만 실패한 경우를 위한 재발송 API:

```typescript
// app/api/quotes/resend-email/route.ts
import { createApiHandler } from '@/lib/api/handler'
import { successResponse } from '@/lib/api/response'
import { ApiErrors } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/server-clients'
import { sendEmail, createQuoteSubmissionTemplate } from '@/lib/email/mailgun'
import { NextRequest } from 'next/server'

const handler = createApiHandler({
  POST: async (req: NextRequest) => {
    const { quoteId } = await req.json()
    
    if (!quoteId) {
      throw ApiErrors.badRequest('quoteId가 필요합니다.')
    }

    const supabase = createAdminClient()

    // 견적서 정보 조회
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      throw ApiErrors.notFound('견적서')
    }

    // 프로젝트 정보 조회
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*, customer_id, full_address, space_type, budget')
      .eq('id', quote.project_id)
      .single()

    if (projectError || !project) {
      throw ApiErrors.notFound('프로젝트')
    }

    // 고객 정보 조회
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('email, phone')
      .eq('id', project.customer_id)
      .single()

    if (customerError || !customer || !customer.email) {
      throw ApiErrors.notFound('고객 이메일')
    }

    // 업체 정보 조회
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, email, phone')
      .eq('id', quote.contractor_id)
      .single()

    if (contractorError || !contractor) {
      throw ApiErrors.notFound('업체 정보')
    }

    // 이메일 발송
    const customerName = customer.email.split('@')[0] || 'Customer'
    
    const emailHTML = createQuoteSubmissionTemplate(
      customerName,
      {
        company_name: contractor.company_name,
        email: contractor.email,
        phone: contractor.phone,
      },
      {
        full_address: project.full_address,
        space_type: project.space_type,
        budget: project.budget,
      },
      {
        price: parseFloat(quote.price),
        description: quote.description || 'No additional details provided',
      }
    )

    const emailResult = await sendEmail({
      to: customer.email,
      subject: 'New Quote Received for Your Project',
      html: emailHTML,
    })

    if (!emailResult.success) {
      throw ApiErrors.internal(
        `이메일 발송 실패: ${emailResult.error}`
      )
    }

    return successResponse(
      { quoteId, customerEmail: customer.email },
      '이메일이 성공적으로 재발송되었습니다.'
    )
  },
})

export const POST = handler
```

## 예방 조치

### 1. Quote Request 생성 시 검증 강화
```typescript
// quote-request 생성 시 customer_id 필수 확인
if (!customer_id) {
  throw ApiErrors.badRequest('고객 ID가 필요합니다.')
}

// 고객 이메일 존재 여부 확인
const { data: user } = await supabase
  .from('users')
  .select('email')
  .eq('id', customer_id)
  .single()

if (!user?.email) {
  throw ApiErrors.badRequest('유효한 고객 이메일이 필요합니다.')
}
```

### 2. 이메일 발송 실패 로깅
```typescript
// 이메일 발송 실패 시 별도 테이블에 기록
if (!emailSent) {
  await supabase.from('email_failures').insert({
    entity_type: 'quote',
    entity_id: quote.id,
    recipient_email: customer.email,
    error_message: emailError,
    created_at: new Date().toISOString()
  })
}
```

### 3. 정기적인 이메일 재시도
```typescript
// Cron job으로 실패한 이메일 재시도
// Vercel Cron: app/api/cron/retry-failed-emails/route.ts
```

## 체크리스트

- [ ] `diagnose-quote-email-issue.sql` 실행하여 문제 확인
- [ ] 고객 이메일 정보 확인 및 수정
- [ ] Mailgun 환경 변수 확인
- [ ] Mailgun API 키 테스트
- [ ] 이메일 재발송 API 생성 (필요한 경우)
- [ ] 애플리케이션 로그 확인
- [ ] 예방 조치 구현

## 추가 참고사항

### 코드 위치
- 견적서 제출 API: `app/api/quotes/submit/route.ts`
- 이메일 발송 함수: `lib/email/mailgun.ts`
- 이메일 템플릿: `createQuoteSubmissionTemplate()` in `mailgun.ts`

### 관련 테이블
- `contractor_quotes`: 견적서 정보
- `quote_requests`: 프로젝트 정보
- `users`: 고객 정보 (이메일 포함)
- `contractors`: 업체 정보
