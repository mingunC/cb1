## Hostinger DNS 설정 가이드 (Mailgun 스팸 방지)

### 문제
Mailgun에서 발송한 이메일이 스팸 폴더로 가는 문제

### 원인
DNS 인증 레코드 (SPF, DKIM, DMARC)가 누락됨

### 해결 방법

#### 1단계: Hostinger 로그인
1. https://hpanel.hostinger.com/ 접속
2. **Domains** 메뉴 클릭
3. **canadabeaver.pro** 선택
4. **DNS / Name Servers** 또는 **Manage** 클릭

#### 2단계: DNS 레코드 추가

**Add New Record** 버튼을 클릭하고 다음 레코드들을 추가:

##### A. SPF 레코드
```
Type: TXT
Name: @
Content: v=spf1 include:mailgun.org ~all
TTL: 3600
```

##### B. DKIM 레코드 1 (Mailgun에서 값 복사)
```
Type: TXT
Name: krs._domainkey
Content: (Mailgun Dashboard에서 복사)
TTL: 3600
```

Mailgun에서 값 복사하는 방법:
- Mailgun Dashboard → Sending → Domains → canadabeaver.pro → DNS Records
- "krs._domainkey" 레코드의 Value 전체 복사

##### C. DKIM 레코드 2 (Mailgun에서 값 복사)
```
Type: TXT
Name: pic._domainkey
Content: (Mailgun Dashboard에서 복사)
TTL: 3600
```

##### D. DMARC 레코드 (새로 추가)
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:admin@canadabeaver.pro
TTL: 3600
```

#### 3단계: 확인

1. 모든 레코드 저장 후 **10-30분 대기** (Hostinger는 DNS 전파가 빠름)
2. Mailgun Dashboard로 돌아가기
3. **"Verify DNS Settings"** 버튼 클릭
4. 모든 레코드가 **초록색 체크마크**로 표시되어야 함

#### 4단계: 테스트

DNS 확인 후:
```bash
curl -X POST https://canadabeaver.pro/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "mystars100826@gmail.com"}'
```

이메일이 받은편지함으로 정상적으로 도착해야 합니다.

### 추가 개선사항

#### List-Unsubscribe 헤더 추가 (코드)
`lib/email/mailgun.ts` 파일의 `sendEmail` 함수에 추가:

```typescript
const messageData = {
  from: options.from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: Array.isArray(options.to) ? options.to : [options.to],
  subject: options.subject,
  html: options.html,
  text: options.text || '',
  'h:Reply-To': options.replyTo || process.env.EMAIL_REPLY_TO,
  // ✅ 스팸 방지: List-Unsubscribe 헤더
  'h:List-Unsubscribe': '<https://canadabeaver.pro/unsubscribe>',
  'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
};
```

### 최종 체크리스트

- [ ] Hostinger에 SPF 레코드 추가
- [ ] Hostinger에 DKIM 레코드 2개 추가
- [ ] Hostinger에 DMARC 레코드 추가
- [ ] 10-30분 대기
- [ ] Mailgun에서 "Verify DNS Settings" 클릭
- [ ] 모든 레코드 초록색 확인
- [ ] 코드에 List-Unsubscribe 헤더 추가
- [ ] 테스트 이메일 발송

### 예상 결과

DNS 레코드가 모두 확인되면:
- ✅ 이메일이 받은편지함으로 도착
- ✅ "via mailgun.org" 표시 제거
- ✅ 스팸 점수 대폭 감소
- ✅ Gmail/Outlook에서 신뢰할 수 있는 발신자로 인식

### 문제 해결

**Q: DNS 레코드를 추가했는데도 Mailgun에서 확인이 안 됨**
A: 최대 24시간까지 걸릴 수 있습니다. 다음 명령어로 직접 확인:
```bash
# SPF 확인
nslookup -type=txt canadabeaver.pro

# DKIM 확인
nslookup -type=txt krs._domainkey.canadabeaver.pro
nslookup -type=txt pic._domainkey.canadabeaver.pro

# DMARC 확인
nslookup -type=txt _dmarc.canadabeaver.pro
```

**Q: Hostinger에서 Name 필드에 뭘 입력해야 하나요?**
A: 
- SPF: `@` 또는 비워두기
- DKIM 1: `krs._domainkey`
- DKIM 2: `pic._domainkey`
- DMARC: `_dmarc`

**Q: 도메인 이름을 포함해야 하나요?**
A: 아니요, Hostinger는 자동으로 추가합니다. 
예: `krs._domainkey` 입력 → 자동으로 `krs._domainkey.canadabeaver.pro`로 변환

### 참고 링크

- Hostinger DNS 가이드: https://support.hostinger.com/en/articles/1583227-how-to-edit-dns-zone
- Mailgun 문서: https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain
