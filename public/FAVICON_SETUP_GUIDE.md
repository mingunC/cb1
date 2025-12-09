# Canada Beaver Favicon 설정 가이드

## 📁 1단계: 파일 복사

다운로드한 파일들을 Next.js 프로젝트의 `/public` 폴더에 복사하세요:

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon-48x48.png
├── favicon-96x96.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
└── site.webmanifest
```

## 🔧 2단계: Next.js App Router 메타데이터 설정

### 방법 A: `app/layout.tsx`에서 metadata 설정 (권장)

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Canada Beaver - Trusted Renovation Experts Across Canada',
  description: 'Tired of renovation scams? We connect you with vetted Toronto pros for secure, stress-free home transformations.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}
```

### 방법 B: 만약 기존에 `<head>`를 직접 관리하고 있다면

```html
<!-- HTML head 태그 안에 추가 -->
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#b91c1c" />
```

## 🤖 3단계: robots.txt 확인

`/public/robots.txt` 파일에서 favicon이 차단되지 않았는지 확인하세요:

```txt
User-agent: *
Allow: /

# favicon 파일들이 차단되지 않았는지 확인
# 아래와 같이 Disallow 되어 있으면 안됩니다:
# Disallow: /*.ico
# Disallow: /*.png
```

## 🔄 4단계: 배포 후 Google에 재크롤링 요청

1. [Google Search Console](https://search.google.com/search-console) 접속
2. canadabeaver.pro 속성 선택
3. URL 검사 도구에서 홈페이지 URL 입력: `https://canadabeaver.pro`
4. "색인 생성 요청" 클릭

## ⏰ 소요 시간

Google이 새 favicon을 인식하고 검색 결과에 반영하기까지 **며칠에서 몇 주** 정도 걸릴 수 있습니다.

## ✅ 체크리스트

- [ ] 모든 favicon 파일을 `/public`에 복사
- [ ] `layout.tsx`에 metadata 설정 추가
- [ ] `site.webmanifest` 파일 복사
- [ ] robots.txt에서 차단되지 않았는지 확인
- [ ] Vercel에 배포
- [ ] Google Search Console에서 재색인 요청

## 🧪 테스트 방법

배포 후 아래 URL로 직접 접근해서 favicon이 잘 보이는지 확인:
- https://canadabeaver.pro/favicon.ico
- https://canadabeaver.pro/favicon-48x48.png
- https://canadabeaver.pro/apple-touch-icon.png
