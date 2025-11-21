'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ko', label: 'KR' },
    { code: 'zh', label: '中文' }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '');
    const newPath = `/${newLocale}${pathWithoutLocale || ''}`;
    
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        aria-label="Select language"
        type="button"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLanguage.label}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                currentLocale === lang.code ? 'bg-blue-50' : ''
              }`}
              type="button"
            >
              <span className="text-sm font-medium text-gray-700">{lang.label}</span>
              {currentLocale === lang.code && (
                <span className="text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
