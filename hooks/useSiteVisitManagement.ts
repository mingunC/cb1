// hooks/useSiteVisitManagement.ts
import { useCallback, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export const useSiteVisitManagement = () => {
  const [isLoading, setIsLoading] = useState(false)

  // 현장방문 신청
  const handleSiteVisitApplication = useCallback(async (
    quoteId: string,
    contractorId: string,
    additionalInfo?: any
  ) => {
    console.log('handleSiteVisitApplication 호출됨', { quoteId, contractorId })

    if (!quoteId || !contractorId) {
      alert('필수 정보가 누락되었습니다.')
      return { success: false, error: 'Missing required parameters' }
    }

    if (!confirm('현장방문을 신청하시겠습니까?')) {
      return { success: false, error: 'Cancelled by user' }
    }

    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      // 트랜잭션처럼 처리하기 위해 순차적으로 실행
      
      // 1. 이미 신청한 내역이 있는지 확인
      const { data: existingApplication, error: checkError } = await supabase
        .from('site_visit_applications')
        .select('id, is_cancelled')
        .eq('project_id', quoteId)
        .eq('contractor_id', contractorId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingApplication && !existingApplication.is_cancelled) {
        alert('이미 현장방문을 신청하셨습니다.')
        return { success: false, error: 'Already applied' }
      }

      // 2. 기존 취소된 신청이 있으면 재활성화, 없으면 새로 생성
      if (existingApplication && existingApplication.is_cancelled) {
        // 재활성화
        const { error: reactivateError } = await supabase
          .from('site_visit_applications')
          .update({
            is_cancelled: false,
            cancelled_at: null,
            cancelled_by: null,
            ...additionalInfo
          })
          .eq('id', existingApplication.id)

        if (reactivateError) throw reactivateError
      } else {
        // 새로 생성
        const { error: insertError } = await supabase
          .from('site_visit_applications')
          .insert({
            project_id: quoteId,
            contractor_id: contractorId,
            is_cancelled: false,
            ...additionalInfo
          })

        if (insertError) throw insertError
      }

      // 3. quotes 테이블의 상태 업데이트
      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({ status_detail: 'site_visit_requested' })
        .eq('id', quoteId)

      if (updateError) throw updateError

      alert('현장방문 신청이 완료되었습니다.')
      return { success: true }

    } catch (error) {
      console.error('현장방문 신청 중 오류:', error)
      alert('현장방문 신청 중 오류가 발생했습니다.')
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 현장방문 취소 (Soft Delete)
  const handleSiteVisitCancellation = useCallback(async (
    applicationId: string,
    quoteId: string,
    userId: string
  ) => {
    console.log('handleSiteVisitCancellation 호출됨', { applicationId, quoteId })

    if (!applicationId || !quoteId) {
      alert('필수 정보가 누락되었습니다.')
      return { success: false, error: 'Missing required parameters' }
    }

    if (!confirm('현장방문 신청을 취소하시겠습니까?\n취소 후 다시 신청할 수 있습니다.')) {
      return { success: false, error: 'Cancelled by user' }
    }

    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      // 1. site_visit_applications 소프트 삭제
      const { error: cancelError } = await supabase
        .from('site_visit_applications')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId
        })
        .eq('id', applicationId)

      if (cancelError) throw cancelError

      // 2. quotes 테이블 상태 되돌리기
      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({ status_detail: 'approved' })
        .eq('id', quoteId)

      if (updateError) throw updateError

      alert('현장방문 신청이 취소되었습니다.')
      return { success: true }

    } catch (error) {
      console.error('현장방문 취소 중 오류:', error)
      alert('현장방문 취소 중 오류가 발생했습니다.')
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 현장방문 신청 상태 확인
  const checkSiteVisitStatus = useCallback(async (quoteId: string, contractorId: string) => {
    const supabase = createBrowserClient()

    try {
      const { data, error } = await supabase
        .from('site_visit_applications')
        .select('*')
        .eq('project_id', quoteId)
        .eq('contractor_id', contractorId)
        .eq('is_cancelled', false)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return {
        hasApplied: !!data,
        application: data
      }
    } catch (error) {
      console.error('현장방문 상태 확인 중 오류:', error)
      return {
        hasApplied: false,
        application: null
      }
    }
  }, [])

  return {
    handleSiteVisitApplication,
    handleSiteVisitCancellation,
    checkSiteVisitStatus,
    isLoading
  }
}
