'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
]

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>(languages[1]) // Default to English
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Detect current language from pathname
  useEffect(() => {
    const pathLang = pathname.split('/')[1]
    const lang = languages.find(l => l.code === pathLang)
    if (lang) {
      setCurrentLang(lang)
    }
  }, [pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const switchLanguage = (langCode: string) => {
    const lang = languages.find(l => l.code === langCode)
    if (lang) {
      setCurrentLang(lang)
      
      // Get the path without the current locale
      const pathSegments = pathname.split('/')
      const currentLocale = pathSegments[1]
      
      // Check if current path starts with a locale
      const hasLocale = languages.some(l => l.code === currentLocale)
      
      let newPath
      if (hasLocale) {
        // Replace the locale in the path
        pathSegments[1] = langCode
        newPath = pathSegments.join('/')
      } else {
        // Add the locale to the path
        newPath = `/${langCode}${pathname}`
      }
      
      router.push(newPath)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <Globe className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currentLang.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  currentLang.code === lang.code ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {currentLang.code === lang.code && (
                  <span className="text-emerald-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
