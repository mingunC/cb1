import { Project, ProjectStatus } from '@/types/contractor'
import { PROJECT_TYPE_MAP, SPACE_TYPE_MAP, DEBUG_PROJECT_IDS } from '@/constants/contractor'

/**
 * 프로젝트 타입 정보 반환
 */
export const getProjectTypeInfo = (type: string) => {
  return PROJECT_TYPE_MAP[type as keyof typeof PROJECT_TYPE_MAP] || 
    { label: type, color: 'bg-gray-100 text-gray-700' }
}

/**
 * 부동산 타입 정보 반환
 */
export const getSpaceTypeInfo = (spaceType: string) => {
  return SPACE_TYPE_MAP[spaceType as keyof typeof SPACE_TYPE_MAP] || 
    { label: spaceType, color: 'bg-gray-100 text-gray-700' }
}

/**
 * 금액 포맷팅 (천 단위 구분)
 */
export const formatPrice = (value: string): string => {
  const numericValue = value.replace(/[^0-9]/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 현장방문 누락 여부 확인
 */
export const isSiteVisitMissed = (project: Project, contractorId: string): boolean => {
  // 현장방문이 완료되었는데 본인이 신청하지 않은 경우만 누락
  if (project.status === 'site-visit-completed' || project.status === 'bidding') {
    return !project.site_visit_application || project.site_visit_application.is_cancelled
  }
  
  return false
}

/**
 * 프로젝트 상태 계산
 */
export const calculateProjectStatus = (project: Project, contractorId: string): ProjectStatus => {
  // 1. 견적서를 제출한 경우
  if (project.contractor_quote) {
    if (project.contractor_quote.status === 'accepted') return 'selected'
    if (project.contractor_quote.status === 'rejected') return 'not-selected'
    return 'quoted'
  }
  
  // 2. 현장방문 신청한 경우
  if (project.site_visit_application) {
    // 취소된 경우 다시 신청 가능하도록 pending 상태로
    if (project.site_visit_application.is_cancelled) {
      return 'pending'
    }
    // 활성 신청인 경우
    if (project.status === 'site-visit-completed' || project.status === 'bidding') {
      return 'site-visit-completed'
    }
    return 'site-visit-applied'
  }
  
  // 3. 기본 상태에 따른 분류
  if (project.status === 'cancelled') return 'cancelled'
  if (project.status === 'completed') return 'completed'
  if (project.status === 'quote-submitted') return 'quoted'
  if (project.status === 'approved' || project.status === 'site-visit-pending') return 'approved'
  if (project.status === 'bidding') return 'bidding'
  
  return 'pending'
}

/**
 * 현장방문 신청 가능 여부 확인
 * approved, site-visit-pending, bidding 상태에서 신청 가능
 */
export const canApplySiteVisit = (project: Project): boolean => {
  const validStatuses = ['approved', 'site-visit-pending', 'bidding']
  return validStatuses.includes(project.status) &&
         !project.contractor_quote &&
         (!project.site_visit_application || project.site_visit_application.is_cancelled)
}

/**
 * 디버깅 로그 (개발 환경에서만 작동)
 */
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (process.env.NODE_ENV === 'development') console.log(message, data)
  }
}

/**
 * 날짜 포맷팅
 */
export const formatDate = (date: string | undefined, locale: string = 'ko-KR'): string => {
  if (!date) return '미정'
  try {
    return new Date(date).toLocaleDateString(locale)
  } catch {
    return '미정'
  }
}

/**
 * 방문일 추출
 */
export const getVisitDate = (project: Project): string => {
  if (project.visit_date) {
    return formatDate(project.visit_date)
  }
  if (project.visit_dates && project.visit_dates.length > 0) {
    return formatDate(project.visit_dates[0])
  }
  return '미정'
}
