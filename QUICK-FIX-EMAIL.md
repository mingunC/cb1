# 이메일 전송 안 됨 - 빠른 해결 가이드

## 🚨 증상
견적서 제출 시 고객에게 이메일이 도착하지 않음

## ⚡ 빠른 체크리스트 (5분)

### ✅ 단계 1: 환경 변수 확인 (2분)

**필요한 6개 환경 변수:**

```bash
# .env.local 파일 확인
MAILGUN_API_KEY=key-xxx...
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_DOMAIN_URL=https://api.mailgun.net
EMAIL_FROM_NAME=Canada Beaver
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

**하나라도 없으면 이메일이 안 보내집니다!**

### ✅ 단계 2: Mailgun 계정 확인 (2분)

1. Mailgun 계정이 있나요?
   - **없음** → https://www.mailgun.com/ 가입 (무료)
   - **있음** → 다음 단계

2. API Key 확인
   - Mailgun Dashboard → Settings → API Keys
   - Private API Key 복사 (`key-`로 시작)

3. Domain 확인
   - Mailgun Dashboard → Sending → Domains
   - 샌드박스 도메인 또는 실제 도메인 사용

### ✅ 단계 3: 설정 추가 (1분)

**로컬 (`.env.local`):**
```bash
MAILGUN_API_KEY=여기에_복사한_키
MAILGUN_DOMAIN=여기에_도메인
MAILGUN_DOMAIN_URL=https://api.mailgun.net
EMAIL_FROM_NAME=Canada Beaver
EMAIL_FROM_ADDRESS=noreply@canadabeaver.pro
EMAIL_REPLY_TO=support@canadabeaver.pro
```

**Vercel:**
- Settings → Environment Variables
- 위 6개 변수 모두 추가
- Production, Preview, Development 모두 체크

### ✅ 단계 4: 재시작/재배포

**로컬:**
```bash
npm run dev  # 서버 재시작
```

**Vercel:**
- Git push 또는 Redeploy

## 🧪 테스트

1. 견적서 제출 시도
2. 터미널 확인:
   - ✅ `Email sent successfully` - 성공!
   - ❌ `Email service not configured` - 환경 변수 누락
   - ❌ `Mailgun API Error` - API 키 또는 도메인 오류

3. 이메일함 확인 (스팸함 포함!)

## 🔍 자주 발생하는 문제

### 문제 1: "Email service not configured"
→ 6개 환경 변수 중 하나라도 누락됨
→ `.env.local` 다시 확인

### 문제 2: 로컬은 되는데 Vercel은 안 됨
→ Vercel 환경 변수 누락
→ Vercel Settings에서 6개 변수 추가 후 재배포

### 문제 3: API 키가 틀렸다고 나옴
→ API 키를 다시 복사 (공백 주의)
→ `key-`로 시작하는지 확인

### 문제 4: 샌드박스에서 이메일 안 보내짐
→ Mailgun → Authorized Recipients
→ 테스트 이메일 주소 추가
→ 확인 링크 클릭

## 📊 환경 변수 상태 확인

로컬에서 확인:
```bash
# 터미널에서
echo $MAILGUN_API_KEY
echo $MAILGUN_DOMAIN
```

값이 안 나오면 `.env.local` 파일 저장 후 서버 재시작

## 🆘 여전히 안 되는 경우

1. **상세 가이드 확인**: `EMAIL-TROUBLESHOOTING-GUIDE.md`
2. **로그 확인**:
   - 로컬: 터미널 로그
   - Vercel: Deployments → Functions → 로그
3. **Mailgun 대시보드**: Sending → Logs에서 전송 이력 확인

## 📋 필수 체크리스트

환경 설정:
- [ ] Mailgun 계정 있음
- [ ] API Key 복사함
- [ ] 도메인 확인함
- [ ] `.env.local`에 6개 변수 추가
- [ ] Vercel에 6개 변수 추가 (배포 환경)
- [ ] 서버 재시작함
- [ ] 재배포함 (Vercel)

테스트:
- [ ] 견적서 제출 시도
- [ ] `✅ Email sent successfully` 로그 확인
- [ ] 이메일 수신 확인

## 🚀 샌드박스 모드 (임시 해결)

실제 도메인 설정이 어려운 경우:

```bash
# .env.local
MAILGUN_DOMAIN=sandboxXXXXXXXXXX.mailgun.org  # Mailgun에서 확인
```

**제한사항:**
- 승인된 수신자에게만 발송
- Mailgun에서 이메일 주소 승인 필요
- 실제 배포 시 실제 도메인으로 변경 권장

## ⏱️ 예상 해결 시간

- Mailgun 가입 및 설정: **5분**
- 환경 변수 추가: **2분**
- 재시작 및 테스트: **2분**
- **총 소요 시간: 약 10분**

## 🔗 관련 문서

- 상세 가이드: `EMAIL-TROUBLESHOOTING-GUIDE.md`
- 환경 변수 예시: `.env.example`
- 이메일 코드: `lib/email/mailgun.ts`

---

문제가 계속되면 Mailgun 대시보드에서 Logs를 확인하거나 상세 가이드를 참조하세요!
