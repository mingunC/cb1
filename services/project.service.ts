// ============================================
// 4. services/project.service.ts - API 서비스
// ============================================
import { createBrowserClient } from '@/lib/supabase/clients'
import type { Project, SiteVisitApplication, ContractorQuote } from '@/types'

export class ProjectService {
  private supabase = createBrowserClient()

  async getProjects(contractorId: string, offset = 0, limit = 9) {
    const { data, error } = await this.supabase
      .from('quote_requests')
      .select(`
        *,
        site_visit_applications!left (
          id, contractor_id, status, applied_at, is_cancelled
        ),
        contractor_quotes!left (
          id, contractor_id, price, description, pdf_url, status
        )
      `)
      .in('status', ['approved', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    
    // 현재 업체의 데이터만 필터링
    return (data || []).map(project => ({
      ...project,
      my_site_visit: project.site_visit_applications?.find(
        (app: SiteVisitApplication) => app.contractor_id === contractorId
      ),
      my_quote: project.contractor_quotes?.find(
        (quote: ContractorQuote) => quote.contractor_id === contractorId
      )
    }))
  }

  async updateProjectStatus(projectId: string, newStatus: string) {
    const { data, error } = await this.supabase
      .from('quote_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error

    // 비딩 상태로 변경 시 현장방문 자동 완료
    if (newStatus === 'bidding') {
      await this.completeSiteVisits(projectId)
    }

    return data
  }

  private async completeSiteVisits(projectId: string) {
    const { error } = await this.supabase
      .from('site_visit_applications')
      .update({ 
        status: 'completed',
        notes: '비딩 단계 전환으로 자동 완료',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('status', 'pending')

    if (error) {
      console.error('Failed to complete site visits:', error)
    }
  }

  async applySiteVisit(projectId: string, contractorId: string) {
    // 기존 신청 확인
    const { data: existing } = await this.supabase
      .from('site_visit_applications')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single()

    if (existing?.is_cancelled) {
      // 취소된 신청 재활성화
      const { error } = await this.supabase
        .from('site_visit_applications')
        .update({
          is_cancelled: false,
          cancelled_at: null,
          cancelled_by: null,
          status: 'pending'
        })
        .eq('id', existing.id)
      
      if (error) throw error
      return { reactivated: true }
    }

    if (existing) {
      throw new Error('이미 신청했습니다')
    }

    // 새 신청 생성
    const { error } = await this.supabase
      .from('site_visit_applications')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        status: 'pending'
      })

    if (error) throw error
    return { created: true }
  }

  async submitQuote(projectId: string, contractorId: string, data: {
    price: number
    description: string
    pdf_url: string
    pdf_filename: string
  }) {
    const { error } = await this.supabase
      .from('contractor_quotes')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        ...data,
        status: 'pending'
      })

    if (error) throw error
  }
}
