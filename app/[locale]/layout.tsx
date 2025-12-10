import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from 'react-hot-toast'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Canada Beaver | 토론토 인테리어 &amp; 레노베이션 전문 (Toronto Renovation)',
  description: 'Canada Beaver는 토론토 및 GTA 지역 최고의 레노베이션 업체 연결 서비스입니다. 믿을 수 있는 인테리어 전문가를 만나보세요. Kitchen, Bathroom, Basement Renovation.',
  keywords: '리노베이션, 인테리어, 업체, 견적, 홈리모델링',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Canada Beaver - 토론토 인테리어의 모든 것',
    description: '믿을 수 있는 레노베이션 업체를 찾고 계신가요? Canada Beaver에서 무료 견적을 받아보세요.',
  },
}

// 지원하는 로케일 목록
const locales = ['en', 'ko', 'zh']

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // 유효한 로케일인지 확인
  if (!locales.includes(locale)) {
    notFound()
  }

  // 서버에서 메시지 가져오기
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        {/* Manifest - absolute path to avoid i18n prefix */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#b91c1c" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
