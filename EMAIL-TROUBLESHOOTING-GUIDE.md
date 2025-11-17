# 이메일 전송 문제 해결 가이드

## 🚨 문제 증상

견적서 제출 시 고객에게 자동 이메일이 발송되지 않음

## 🔍 원인 분석

이메일 전송은 **Mailgun** 서비스를 사용하며, 다음 환경 변수들이 필요합니다:

### 필수 환경 변수:
```bash
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_DOMAIN_URL=https://api.mailgun.net
EMAIL_FROM_NAME=Canada Beaver
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

## ✅ 해결 방법

### 1단계: Mailgun 계정 확인

1. **Mailgun 가입** (아직 없는 경우)
   - https://www.mailgun.com/ 접속
   - 무료 플랜으로 시작 (월 5,000개 이메일 무료)

2. **Domain 설정**
   - Mailgun Dashboard → Sending → Domains
   - 도메인 추가 또는 Mailgun 샌드박스 도메인 사용
   - DNS 레코드 설정 (실제 도메인 사용 시)

3. **API Key 복사**
   - Mailgun Dashboard → Settings → API Keys
   - Private API Key 복사

### 2단계: 환경 변수 설정

#### 로컬 환경 (`.env.local`):

```bash
# Supabase (이미 있음)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Mailgun Configuration (추가 필요!)
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.canadabeaver.pro
MAILGUN_DOMAIN_URL=https://api.mailgun.net
EMAIL_FROM_NAME=Canada Beaver
EMAIL_FROM_ADDRESS=noreply@canadabeaver.pro
EMAIL_REPLY_TO=support@canadabeaver.pro
```

**주의사항:**
- `MAILGUN_API_KEY`는 `key-`로 시작합니다
- `MAILGUN_DOMAIN`은 실제 도메인 또는 샌드박스 도메인
- `MAILGUN_DOMAIN_URL`은 대부분 `https://api.mailgun.net` (미국) 또는 `https://api.eu.mailgun.net` (유럽)

#### Vercel 환경:

1. Vercel Dashboard → Settings → Environment Variables
2. 다음 변수들을 **모두** 추가:

| Name | Value | Environments |
|------|-------|-------------|
| `MAILGUN_API_KEY` | key-xxx... | Production, Preview, Development |
| `MAILGUN_DOMAIN` | mg.yourdomain.com | Production, Preview, Development |
| `MAILGUN_DOMAIN_URL` | https://api.mailgun.net | Production, Preview, Development |
| `EMAIL_FROM_NAME` | Canada Beaver | Production, Preview, Development |
| `EMAIL_FROM_ADDRESS` | noreply@yourdomain.com | Production, Preview, Development |
| `EMAIL_REPLY_TO` | support@yourdomain.com | Production, Preview, Development |

### 3단계: 샌드박스 모드로 테스트 (개발 중)

실제 도메인 설정이 어려운 경우, Mailgun 샌드박스 도메인 사용:

```bash
MAILGUN_DOMAIN=sandboxXXXXXXXXXXXXXXXX.mailgun.org
```

**제약사항:** 
- 샌드박스는 승인된 수신자에게만 이메일 발송 가능
- Mailgun Dashboard → Sending → Authorized Recipients에서 이메일 추가

### 4단계: 코드 확인

현재 이메일 전송 코드 (`app/api/quotes/submit/route.ts`):

```typescript
// 이메일 전송은 try-catch로 감싸져 있어
// 실패해도 견적서 제출은 성공함
try {
  const emailResult = await sendEmail({
    to: customer.email,
    subject: 'New Quote Received for Your Project',
    html: emailHTML,
  });

  if (emailResult.success) {
    emailSent = true;
    console.log('✅ Email sent successfully!');
  } else {
    emailError = emailResult.error;
    console.error('❌ Email failed:', emailError);
  }
} catch (error) {
  emailError = error.message;
  console.error('❌ EMAIL PROCESS ERROR:', error);
}
```

### 5단계: 서버 로그 확인

**로컬 개발:**
```bash
npm run dev
```

터미널에서 다음 로그 확인:
- ✅ `Email sent successfully` - 성공
- ❌ `Mailgun credentials missing` - 환경 변수 누락
- ❌ `Email service not configured` - 설정 오류
- ❌ `Mailgun API Error` - API 키 또는 도메인 오류

**Vercel (프로덕션):**
1. Vercel Dashboard → Deployments → 최신 배포 클릭
2. **Functions** 탭 → API route 로그 확인
3. 또는 **Logs** 탭에서 실시간 로그 확인

## 🧪 테스트 방법

### 1. Mailgun 설정 테스트

터미널에서 직접 테스트 (Node.js):

```javascript
// test-mailgun.js
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: 'YOUR_API_KEY',
  url: 'https://api.mailgun.net'
});

mg.messages.create('YOUR_DOMAIN', {
  from: 'Test <test@yourdomain.com>',
  to: ['your-email@example.com'],
  subject: 'Test Email',
  text: 'Testing Mailgun!'
})
.then(msg => console.log('✅ Success:', msg))
.catch(err => console.error('❌ Error:', err));
```

실행:
```bash
node test-mailgun.js
```

### 2. 애플리케이션에서 테스트

1. 환경 변수를 모두 설정
2. 서버 재시작 (`npm run dev`)
3. 견적서 제출 테스트
4. 터미널 로그 확인
5. 이메일 수신 확인

## 📋 체크리스트

환경 설정:
- [ ] Mailgun 계정 생성 완료
- [ ] API Key 복사 완료
- [ ] 도메인 설정 완료 (또는 샌드박스 도메인 사용)
- [ ] `.env.local`에 6개 환경 변수 추가
- [ ] Vercel에 6개 환경 변수 추가
- [ ] 샌드박스 사용 시 Authorized Recipients 추가

테스트:
- [ ] 로컬에서 서버 재시작
- [ ] 견적서 제출 테스트
- [ ] 터미널에서 `✅ Email sent successfully` 로그 확인
- [ ] 수신자 이메일함 확인 (스팸함 포함)
- [ ] Vercel 재배포
- [ ] 프로덕션 환경 테스트

## 🔧 문제 해결

### 문제 1: "Email service not configured"
**원인:** 환경 변수 누락
**해결:** `.env.local` 및 Vercel에 6개 환경 변수 모두 추가

### 문제 2: "Mailgun API Error: 401 Unauthorized"
**원인:** API 키가 틀렸거나 도메인 불일치
**해결:** 
- API 키 다시 복사
- 도메인 이름 정확히 확인 (mg.yourdomain.com)

### 문제 3: "Mailgun API Error: 400 Bad Request"
**원인:** 도메인이 검증되지 않음
**해결:**
- Mailgun에서 도메인 DNS 설정 완료
- 또는 샌드박스 도메인으로 테스트

### 문제 4: 이메일이 스팸함으로 가는 경우
**원인:** 도메인 SPF/DKIM 설정 누락
**해결:**
- Mailgun의 DNS 레코드 모두 추가
- SPF, DKIM, CNAME 레코드 설정

### 문제 5: 샌드박스에서 이메일 안 보내지는 경우
**원인:** 승인된 수신자가 아님
**해결:**
- Mailgun Dashboard → Authorized Recipients
- 테스트할 이메일 주소 추가
- 이메일로 받은 확인 링크 클릭

## 📚 참고 자료

- [Mailgun 공식 문서](https://documentation.mailgun.com/)
- [Mailgun Node.js 라이브러리](https://github.com/mailgun/mailgun.js)
- [DNS 설정 가이드](https://help.mailgun.com/hc/en-us/articles/203637190-How-Do-I-Add-DNS-Records-For-My-Domain-)

## ⚠️ 중요 보안 사항

❌ **절대 하지 말 것:**
- Mailgun API Key를 GitHub에 커밋
- API Key를 클라이언트 코드에서 사용
- API Key를 공개 저장소에 노출

✅ **해야 할 것:**
- `.env.local`에만 저장 (이미 `.gitignore`에 포함됨)
- Vercel 환경 변수로만 관리
- API Key는 절대 공유하지 않기
