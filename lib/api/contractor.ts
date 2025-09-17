import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'
import { Project } from '@/types/contractor'
import { calculateProjectStatus, debugLog } from '@/lib/contractor/projectHelpers'

/**
 * 프로젝트 데이터 페칭
 */
export const fetchProjects = async (
  contractorId: string,
  offset: number = 0,
  limit: number = 9
) => {
  const supabase = createBrowserClient()
  
  const { data: projectsData, error } = await supabase
    .from('quote_requests')
    .select(`
      *,
      site_visit_applications (
        id,
        contractor_id,
        status,
        applied_at,
        is_cancelled,
        cancelled_at,
        cancelled_by,
        contractors (
          id,
          company_name,
          contact_name
        )
      ),
      contractor_quotes (
        id,
        contractor_id,
        price,
        description,
        pdf_url,
        pdf_filename,
        status,
        created_at
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // 프로젝트 데이터 처리
  const processedProjects: Project[] = (projectsData || []).map(project => {
    const myLatestSiteVisit = project.site_visit_applications?.find(
      (app: any) => app.contractor_id === contractorId
    )
    
    const myQuote = project.contractor_quotes?.find(
      (quote: any) => quote.contractor_id === contractorId
    )
    
    return {
      ...project,
      site_visit_application: myLatestSiteVisit,
      contractor_quote: myQuote,
      projectStatus: calculateProjectStatus({
        ...project,
        site_visit_application: myLatestSiteVisit,
        contractor_quote: myQuote
      }, contractorId)
    }
  })

  return processedProjects
}

/**
 * 현장방문 신청
 */
export const applySiteVisit = async (projectId: string, contractorId: string) => {
  const supabase = createBrowserClient()

  // 기존 신청 체크
  const { data: existingApplication, error: checkError } = await supabase
    .from('site_visit_applications')
    .select('*')
    .eq('project_id', projectId)
    .eq('contractor_id', contractorId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError
  }

  // 취소된 신청이 있으면 재활성화
  if (existingApplication && existingApplication.is_cancelled) {
    const { data, error } = await supabase
      .from('site_visit_applications')
      .update({
        is_cancelled: false,
        cancelled_at: null,
        cancelled_by: null,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
      .eq('id', existingApplication.id)
      .select()
      .single()

    if (error) throw error
    
    toast.success('방문 신청이 다시 활성화되었습니다!')
    return data
  }

  // 활성 신청이 이미 있는 경우
  if (existingApplication && !existingApplication.is_cancelled) {
    toast.error('이미 이 프로젝트에 방문 신청을 하셨습니다.')
    return null
  }

  // 새 신청 생성
  const { data, error } = await supabase
    .from('site_visit_applications')
    .insert([{
      project_id: projectId,
      contractor_id: contractorId,
      status: 'pending',
      notes: '',
      is_cancelled: false
    }])
    .select()
    .single()

  if (error) throw error
  
  toast.success('방문 신청이 완료되었습니다!')
  return data
}

/**
 * 현장방문 취소
 */
export const cancelSiteVisit = async (applicationId: string, userId: string) => {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('site_visit_applications')
    .update({
      is_cancelled: true,
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId
    })
    .eq('id', applicationId)
    .select()

  if (error) throw error
  
  if (!data || data.length === 0) {
    throw new Error('취소할 현장방문 신청을 찾을 수 없습니다')
  }
  
  toast.success('현장방문이 취소되었습니다')
  return data[0]
}

/**
 * 업체 정보 조회
 */
export const getContractorInfo = async (userId: string) => {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('contractors')
    .select('id, company_name, contact_name, status')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * 초기 프로젝트 데이터 로드
 */
export const loadInitialProjects = async (contractorId: string) => {
  const supabase = createBrowserClient()
  
  const { data: projectsData } = await supabase
    .from('quote_requests')
    .select(`
      *,
      site_visit_applications!left (*),
      contractor_quotes!left (*)
    `)
    .in('status', [
      'approved', 
      'site-visit-pending', 
      'site-visit-completed', 
      'bidding', 
      'quote-submitted', 
      'selected', 
      'completed'
    ])
    .order('created_at', { ascending: false })
    .range(0, 8)
  
  if (projectsData) {
    return projectsData.map(project => {
      const myLatestSiteVisit = project.site_visit_applications?.find(
        (app: any) => app.contractor_id === contractorId
      )
      const myQuote = project.contractor_quotes?.find(
        (quote: any) => quote.contractor_id === contractorId
      )
      
      return {
        ...project,
        site_visit_application: myLatestSiteVisit,
        contractor_quote: myQuote,
        projectStatus: calculateProjectStatus({
          ...project,
          site_visit_application: myLatestSiteVisit,
          contractor_quote: myQuote
        }, contractorId)
      }
    })
  }
  
  return []
}
