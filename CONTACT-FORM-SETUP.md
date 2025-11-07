# Contact Form Email Setup Guide

## ✅ 현재 상태
Contact Us 페이지의 이메일 발송 기능이 **이미 구현되어 있습니다**! Mailgun을 사용하여 실제 이메일을 발송할 수 있습니다.

## 🔧 설정 방법

### 1. Mailgun 계정 생성
1. [Mailgun](https://www.mailgun.com/) 웹사이트 방문
2. 무료 계정 생성 (월 5,000통 무료)
3. 도메인 추가 및 인증

### 2. Mailgun API 키 확인
1. Mailgun 대시보드에서 **API Keys** 메뉴로 이동
2. **Private API key** 복사

### 3. 환경 변수 설정
`.env.local` 파일에 다음 변수들을 추가하세요:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_DOMAIN_URL=https://api.mailgun.net

# Contact Email (메일을 받을 주소)
CONTACT_EMAIL=admin@canadabeaver.pro
```

### 4. 설정 값 설명

#### MAILGUN_API_KEY
- Mailgun 대시보드의 API Keys 섹션에서 확인
- `key-xxxxxxxxxxxxxxxxxxxxx` 형식

#### MAILGUN_DOMAIN
- Mailgun에서 인증한 도메인
- 예: `mg.yourdomain.com` 또는 `sandbox-xxx.mailgun.org`

#### MAILGUN_DOMAIN_URL
- 미국 리전: `https://api.mailgun.net`
- EU 리전: `https://api.eu.mailgun.net`

#### CONTACT_EMAIL
- Contact Form으로부터 메일을 받을 이메일 주소
- 기본값: `admin@canadabeaver.pro`

## 📧 이메일 형식

Contact Form을 통해 발송되는 이메일은 다음과 같은 형식입니다:

**제목:** `Contact Form: [사용자가 선택한 subject]`

**내용:**
```
New Contact Form Submission

Name: [사용자 이름]
Email: [사용자 이메일]
Subject: [문의 유형]

Message:
[사용자 메시지]
```

**Reply-To:** 사용자의 이메일 주소로 설정되어 있어 바로 답장 가능

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
# 환경변수 설정 후
npm run dev

# 브라우저에서
http://localhost:3000/contact
```

### 2. Contact Form 작성
- Name, Email, Subject, Message 입력
- "Send Message" 버튼 클릭

### 3. 확인
- 브라우저: 성공 메시지 표시
- 서버 로그: `Email sent successfully` 메시지 확인
- Mailgun 대시보드: Logs 섹션에서 전송 확인
- 수신 이메일함: CONTACT_EMAIL로 메일 도착 확인

## 🎯 문의 유형 (Subject)

현재 다음 유형을 지원합니다:
- General Inquiry (일반 문의)
- Technical Support (기술 지원)
- Billing Question (결제 문의)
- Contractor Services (계약자 서비스)
- Feedback (피드백)
- Other (기타)

## ⚠️ 주의사항

### 1. Mailgun 무료 플랜
- 월 5,000통까지 무료
- 3일간 데이터 보관
- 초과 시 유료 플랜으로 업그레이드 필요

### 2. 샌드박스 도메인
- Mailgun 가입 시 기본 제공되는 샌드박스 도메인 사용 가능
- 단, 인증된 수신자에게만 발송 가능
- 프로덕션에서는 실제 도메인 인증 필요

### 3. 스팸 필터
- 발송자 이메일을 연락처에 추가
- SPF, DKIM 레코드 설정 권장

## 🔍 트러블슈팅

### 이메일이 발송되지 않을 때

1. **환경변수 확인**
   ```bash
   # 서버 재시작 필요
   npm run dev
   ```

2. **API 키 확인**
   - Mailgun 대시보드에서 API 키 재확인
   - 올바른 리전(US/EU) 선택

3. **도메인 인증 확인**
   - Mailgun 대시보드 > Domains
   - 도메인 상태가 "Active" 확인

4. **로그 확인**
   - 브라우저 콘솔
   - 서버 터미널
   - Mailgun 대시보드 > Logs

### 이메일이 스팸함으로 가는 경우

1. **SPF 레코드 추가**
   ```
   v=spf1 include:mailgun.org ~all
   ```

2. **DKIM 레코드 추가**
   - Mailgun 대시보드에서 제공하는 DKIM 레코드 복사
   - DNS에 TXT 레코드로 추가

## 📝 코드 구조

### API Route
- 파일: `app/api/contact/route.ts`
- 역할: Contact Form 데이터를 받아 Mailgun API로 이메일 발송

### Contact Page
- 파일: `app/contact/page.tsx`
- 역할: 사용자 입력 폼 제공 및 API 호출

## 🚀 프로덕션 배포

### Vercel 환경변수 설정
1. Vercel 프로젝트 설정
2. Environment Variables 탭
3. 위의 환경변수들 추가
4. 재배포

### 도메인 인증
1. Mailgun에서 실제 도메인 추가
2. DNS 레코드 설정 (MX, TXT, CNAME)
3. 인증 완료 후 샌드박스 도메인에서 전환

## ✨ 기능 확인

- ✅ 입력 폼 검증
- ✅ 이메일 발송
- ✅ 성공/실패 메시지
- ✅ 로딩 상태 표시
- ✅ Reply-To 헤더 설정
- ✅ HTML/텍스트 이메일 지원
- ✅ 에러 핸들링

## 📞 추가 도움

설정에 문제가 있으면:
1. Mailgun 문서: https://documentation.mailgun.com/
2. Contact Form 코드 확인: `app/api/contact/route.ts`
3. 환경변수 예시: `.env.example`
