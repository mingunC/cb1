# 다중언어 기능 가이드 (Multi-language Feature Guide)

## 개요 (Overview)

Canada Beaver 웹사이트에 중국어, 영어, 한국어 지원을 추가했습니다.

## 지원 언어 (Supported Languages)

- 🇨🇳 중국어 (Chinese) - `zh`
- 🇺🇸 영어 (English) - `en` (기본값)
- 🇰🇷 한국어 (Korean) - `ko`

## 주요 기능 (Key Features)

### 1. 언어 선택 버튼 (Language Switcher)
- 헤더에 지구본 아이콘과 국기 이모지로 표시됩니다
- 데스크톱: 아바타 바로 왼쪽에 위치
- 모바일: 햄버거 메뉴 버튼 옆에 위치
- 클릭하면 드롭다운 메뉴가 나타나며 언어를 선택할 수 있습니다

### 2. URL 기반 언어 전환 (URL-based Language Switching)
언어가 URL에 자동으로 포함됩니다:
- 중국어: `https://canadabeaver.pro/zh/...`
- 영어: `https://canadabeaver.pro/en/...`
- 한국어: `https://canadabeaver.pro/ko/...`

### 3. 자동 언어 감지 (Auto Language Detection)
- 처음 방문 시 브라우저 언어 설정에 따라 자동으로 언어가 선택됩니다
- 지원하지 않는 언어는 영어(기본값)로 표시됩니다

## 파일 구조 (File Structure)

```
├── i18n.ts                      # i18n 설정 파일
├── middleware.ts                # 언어 라우팅 미들웨어
├── messages/                    # 번역 파일
│   ├── en.json                  # 영어 번역
│   ├── ko.json                  # 한국어 번역
│   └── zh.json                  # 중국어 번역
├── components/
│   ├── Header.tsx               # 헤더 (언어 선택 버튼 포함)
│   └── LanguageSwitcher.tsx     # 언어 선택 컴포넌트
└── next.config.js               # Next.js 설정 (next-intl 플러그인)
```

## 번역 추가하기 (Adding Translations)

### 1. 번역 파일에 키 추가
각 언어 파일(`messages/*.json`)에 동일한 키를 추가합니다:

```json
// messages/en.json
{
  "common": {
    "welcome": "Welcome"
  }
}

// messages/ko.json
{
  "common": {
    "welcome": "환영합니다"
  }
}

// messages/zh.json
{
  "common": {
    "welcome": "欢迎"
  }
}
```

### 2. 컴포넌트에서 사용
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

## 테스트 방법 (How to Test)

1. **로컬 개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **언어 전환 테스트**
   - 헤더의 지구본 아이콘 클릭
   - 원하는 언어 선택
   - URL이 변경되고 페이지가 새로운 언어로 표시됨

3. **직접 URL 접근 테스트**
   - `http://localhost:3000/en`
   - `http://localhost:3000/ko`
   - `http://localhost:3000/zh`

## 문제 해결 (Troubleshooting)

### 언어가 전환되지 않는 경우
1. 브라우저 캐시를 지우고 다시 시도
2. 개발 서버를 재시작
3. `.next` 폴더를 삭제하고 재빌드:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

### 번역이 표시되지 않는 경우
1. `messages/` 폴더의 JSON 파일이 올바른 형식인지 확인
2. JSON 파일에 문법 오류가 없는지 확인
3. 개발 서버를 재시작

## 향후 개선 사항 (Future Improvements)

- [ ] 더 많은 페이지에 번역 추가
- [ ] 사용자 선호 언어 저장 (localStorage)
- [ ] SEO 최적화 (hreflang 태그)
- [ ] 번역 관리 도구 통합

## 참고 자료 (References)

- [next-intl 공식 문서](https://next-intl-docs.vercel.app/)
- [Next.js i18n 가이드](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
