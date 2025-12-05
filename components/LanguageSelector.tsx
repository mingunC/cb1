'use client'

import { SupportedLanguage, languageOptions } from '@/lib/utils/emailLanguage'

interface LanguageSelectorProps {
  selectedLanguages: SupportedLanguage[]
  onChange: (languages: SupportedLanguage[]) => void
  locale?: string
  label?: string
  description?: string
  required?: boolean
  error?: string
}

export default function LanguageSelector({
  selectedLanguages,
  onChange,
  locale = 'en',
  label,
  description,
  required = false,
  error
}: LanguageSelectorProps) {
  const handleLanguageChange = (lang: SupportedLanguage, checked: boolean) => {
    if (checked) {
      onChange([...selectedLanguages, lang])
    } else {
      onChange(selectedLanguages.filter(l => l !== lang))
    }
  }

  const labels = {
    en: {
      title: 'Preferred Languages',
      description: 'Select the languages you prefer for email notifications (multiple selection allowed)',
      required: 'Please select at least one language'
    },
    ko: {
      title: '선호 언어',
      description: '이메일 알림을 받을 언어를 선택하세요 (복수 선택 가능)',
      required: '최소 1개 이상의 언어를 선택해주세요'
    },
    zh: {
      title: '首选语言',
      description: '选择您希望接收电子邮件通知的语言（可多选）',
      required: '请至少选择一种语言'
    }
  }

  const t = labels[locale as keyof typeof labels] || labels.en

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label || t.title} {required && '*'}
      </label>
      <p className="text-xs text-gray-500 mb-3">
        {description || t.description}
      </p>
      <div className="space-y-2">
        {languageOptions.map((option) => (
          <label key={option.value} className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedLanguages.includes(option.value)}
              onChange={(e) => handleLanguageChange(option.value, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
              {option.label[locale] || option.label.en}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      {required && selectedLanguages.length === 0 && !error && (
        <p className="text-red-500 text-sm mt-1">{t.required}</p>
      )}
    </div>
  )
}
