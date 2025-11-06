# Supabase 이메일 발신자 설정 가이드

## 목표
이메일 발신자 이름을 "Supabase Auth"에서 "Canada Beaver"로 변경

## 방법 1: Supabase Dashboard 기본 설정 (가장 간단)

### 단계별 설정

1. **Supabase Dashboard 접속**
   - https://app.supabase.com
   - 프로젝트 선택

2. **Authentication 설정으로 이동**
   ```
   Authentication > Settings > Email
   ```

3. **발신자 정보 변경**
   - **Sender Name**: `Canada Beaver` 입력
   - **Sender Email**: 기본값 유지 또는 변경
   - **Save** 버튼 클릭

4. **이메일 템플릿 확인**
   ```
   Authentication > Email Templates
   ```
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password
   
   각 템플릿에서 `{{ .SiteURL }}`과 같은 변수 확인

## 방법 2: Custom SMTP 설정 (권장)

### 왜 Custom SMTP?
- ✅ 자신의 도메인 사용 가능 (noreply@canadabeaver.com)
- ✅ 스팸 필터링 회피 가능
- ✅ 전문적인 이미지
- ✅ 더 높은 이메일 전송률

### Gmail SMTP 설정

1. **Gmail 앱 비밀번호 생성**
   - Google 계정 > 보안 > 2단계 인증 활성화
   - 앱 비밀번호 생성
   - 16자리 비밀번호 복사

2. **Supabase SMTP 설정**
   ```
   Project Settings > Auth > SMTP Settings
   ```
   
   입력값:
   ```
   Enable Custom SMTP: ON
   Sender Name: Canada Beaver
   Sender Email: noreply@canadabeaver.com (또는 gmail 주소)
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [16자리 앱 비밀번호]
   ```

3. **테스트**
   - Save 후 회원가입 테스트
   - 이메일 발신자 확인

### SendGrid SMTP 설정 (무료 100통/일)

1. **SendGrid 계정 생성**
   - https://sendgrid.com
   - 무료 계정 생성

2. **API Key 생성**
   - Settings > API Keys
   - Create API Key
   - Full Access 권한

3. **Supabase SMTP 설정**
   ```
   Enable Custom SMTP: ON
   Sender Name: Canada Beaver
   Sender Email: noreply@canadabeaver.com
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [SendGrid API Key]
   ```

### AWS SES 설정 (대량 발송 시)

1. **AWS SES 설정**
   - AWS Console > SES
   - 이메일 주소 인증
   - SMTP 자격 증명 생성

2. **Supabase SMTP 설정**
   ```
   Enable Custom SMTP: ON
   Sender Name: Canada Beaver
   Sender Email: noreply@canadabeaver.com
   Host: email-smtp.[region].amazonaws.com
   Port: 587
   Username: [AWS SMTP Username]
   Password: [AWS SMTP Password]
   ```

## 이메일 템플릿 커스터마이징

### 확인 이메일 템플릿 수정

```
Authentication > Email Templates > Confirm signup
```

**기본 템플릿:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

**커스터마이징된 템플릿:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1a73e8; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">🦫 Canada Beaver</h1>
  </div>
  
  <div style="padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #333;">Welcome to Canada Beaver!</h2>
    <p style="color: #666; line-height: 1.6;">
      Thank you for signing up. Please verify your email address to get started.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #1a73e8; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #999; font-size: 12px; margin-top: 30px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
  
  <div style="background-color: #333; padding: 20px; text-align: center;">
    <p style="color: #999; font-size: 12px; margin: 0;">
      © 2025 Canada Beaver. All rights reserved.
    </p>
  </div>
</div>
```

## 테스트

1. **회원가입 테스트**
   ```bash
   # 로컬에서 테스트
   http://localhost:3000/signup
   ```

2. **이메일 확인**
   - 발신자: "Canada Beaver" 표시 확인
   - 이메일 디자인 확인
   - 링크 작동 확인

3. **스팸 필터 확인**
   - Gmail, Naver, Daum 등 여러 이메일에서 테스트
   - 스팸함에 들어가지 않는지 확인

## 문제 해결

### 이메일이 스팸으로 분류되는 경우

1. **SPF 레코드 추가** (Custom SMTP 사용 시)
   ```
   도메인 DNS에 추가:
   v=spf1 include:_spf.google.com ~all
   ```

2. **DKIM 설정** (SendGrid/AWS SES)
   - 각 서비스의 DKIM 가이드 참고

3. **도메인 인증**
   - 가능하면 자체 도메인 사용

### 이메일이 발송되지 않는 경우

1. **SMTP 설정 확인**
   - Host, Port, Username, Password 재확인
   - Supabase 로그 확인

2. **Gmail 보안 설정**
   - "보안 수준이 낮은 앱 액세스" 허용
   - 앱 비밀번호 사용

3. **Rate Limit 확인**
   - Gmail: 500통/일
   - SendGrid Free: 100통/일
   - 제한 초과 시 대기

## 권장 설정

### 개발 환경
- 기본 Supabase SMTP 사용
- Sender Name만 "Canada Beaver"로 변경

### 프로덕션 환경
- SendGrid 또는 AWS SES 사용
- 자체 도메인 (noreply@canadabeaver.com)
- SPF/DKIM 설정
- 커스텀 이메일 템플릿

## 참고 링크

- [Supabase Auth Config](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [Gmail SMTP](https://support.google.com/mail/answer/7126229)
- [AWS SES](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)
