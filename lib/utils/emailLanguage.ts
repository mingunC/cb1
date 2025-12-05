/**
 * 이메일 발송 언어 결정 유틸리티
 * 
 * 언어 우선순위:
 * - 영어가 포함되면 → 영어
 * - 영어 없이 중국어만 → 중국어
 * - 영어 없이 한국어만 → 한국어
 * - 기본 → 영어
 */

export type SupportedLanguage = 'en' | 'zh' | 'ko'

/**
 * 선택된 언어들로부터 이메일 발송 언어를 결정합니다.
 * @param preferredLanguages 사용자가 선택한 언어 배열
 * @returns 이메일 발송에 사용할 언어
 */
export function determineEmailLanguage(preferredLanguages: string[]): SupportedLanguage {
  // 배열이 비어있으면 기본값 영어
  if (!preferredLanguages || preferredLanguages.length === 0) {
    return 'en'
  }

  // 영어가 포함되어 있으면 영어
  if (preferredLanguages.includes('en')) {
    return 'en'
  }

  // 영어 없이 중국어만 있으면 중국어
  if (preferredLanguages.includes('zh') && !preferredLanguages.includes('ko')) {
    return 'zh'
  }

  // 영어 없이 한국어만 있으면 한국어
  if (preferredLanguages.includes('ko') && !preferredLanguages.includes('zh')) {
    return 'ko'
  }

  // 중국어와 한국어 둘 다 있는데 영어가 없으면 → 기본 영어
  // (요구사항에 명시되지 않았지만 영어를 기본값으로)
  return 'en'
}

/**
 * 언어 코드를 표시 이름으로 변환합니다.
 */
export function getLanguageDisplayName(lang: SupportedLanguage, locale: string = 'en'): string {
  const names: Record<SupportedLanguage, Record<string, string>> = {
    en: { en: 'English', ko: '영어', zh: '英语' },
    zh: { en: 'Chinese', ko: '중국어', zh: '中文' },
    ko: { en: 'Korean', ko: '한국어', zh: '韩语' }
  }
  return names[lang]?.[locale] || names[lang]?.en || lang
}

/**
 * 언어 옵션 목록
 */
export const languageOptions: { value: SupportedLanguage; label: Record<string, string> }[] = [
  { 
    value: 'en', 
    label: { en: 'English', ko: '영어', zh: '英语' } 
  },
  { 
    value: 'zh', 
    label: { en: 'Chinese', ko: '중국어', zh: '中文' } 
  },
  { 
    value: 'ko', 
    label: { en: 'Korean', ko: '한국어', zh: '韩语' } 
  }
]
