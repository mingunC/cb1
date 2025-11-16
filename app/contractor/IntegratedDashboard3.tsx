'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin, User, Trophy, X, UserCircle, Briefcase, TrendingUp, FileText, Ban, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData } from '@/types/contractor'
import { calculateProjectStatus } from '@/lib/contractor/projectHelpers'
import { StatusBadge } from '@/components/ui'
import ProjectFilters from '@/components/contractor/ProjectFilters'
import ProjectCard from '@/components/contractor/ProjectCard'
import QuoteModal from '@/components/contractor/QuoteModal'
import { apiPost } from '@/lib/api/client'

interface Props {
  initialContractorData?: any
}

export default function IntegratedContractorDashboard({ initialContractorData }: Props) {
  const router = useRouter()
  
  // ... 나머지 state 선언은 동일 ...

  // ✅ 현장방문 신청/취소 토글 함수 - apiPost 사용
  const handleToggleSiteVisit = async (project: Project) => {
    if (process.env.NODE_ENV === 'development') console.log('🔄 Toggle Site Visit clicked!', {
      projectId: project.id,
      contractorId: contractorData?.id,
      hasSiteVisit: !!project.siteVisit,
      siteVisitStatus: project.siteVisit?.status
    })

    if (!contractorData?.id) {
      console.error('❌ No contractor ID')
      toast.error('Contractor information not found')
      return
    }

    // 이미 처리 중인 경우 중복 클릭 방지
    if (applyingProjectId === project.id) {
      if (process.env.NODE_ENV === 'development') console.log('⚠️ Already processing this project')
      return
    }

    // ✅ 현장방문 신청이 있는 경우 → 취소
    if (project.siteVisit) {
      // 이미 완료된 현장방문은 취소 불가
      if (project.siteVisit.status === 'completed') {
        toast.error('Cannot cancel completed site visit')
        return
      }

      const confirmed = window.confirm('Are you sure you want to cancel the site visit application?')
      if (!confirmed) return

      setApplyingProjectId(project.id)
      toast.loading('Cancelling site visit...', { id: 'site-visit-action' })

      try {
        await apiPost('/api/cancel-site-visit', {
          projectId: project.id,
          contractorId: contractorData.id
        })

        toast.dismiss('site-visit-action')
        toast.success('Site visit application cancelled')
        
        // ✅ 약간의 지연 후 데이터 새로고침 (DB 업데이트 완료 대기)
        setTimeout(async () => {
          await loadProjects(false)
        }, 500)

      } catch (error: any) {
        console.error('Error cancelling site visit:', error)
        toast.dismiss('site-visit-action')
        toast.error(error.message || 'Failed to cancel site visit')
        setTimeout(async () => {
          await loadProjects(false)
        }, 500)
      } finally {
        setApplyingProjectId(null)
      }
      return
    }

    // ✅ 현장방문 신청이 없는 경우 → 신청
    setApplyingProjectId(project.id)
    toast.loading('Applying for site visit...', { id: 'site-visit-action' })

    try {
      await apiPost('/api/apply-site-visit', {
        projectId: project.id,
        contractorId: contractorData.id
      })

      toast.dismiss('site-visit-action')
      toast.success('Site visit application submitted!')
      
      // ✅ 약간의 지연 후 데이터 새로고침 (DB 업데이트 완료 대기)
      setTimeout(async () => {
        await loadProjects(false)
      }, 500)
      
    } catch (error: any) {
      console.error('Error applying for site visit:', error)
      toast.dismiss('site-visit-action')
      
      // 409 Conflict는 이미 신청된 경우
      if (error.message?.includes('already applied')) {
        toast.error('You have already applied for this site visit')
      } else {
        toast.error(error.message || 'Failed to apply for site visit')
      }
      
      setTimeout(async () => {
        await loadProjects(false)
      }, 500)
    } finally {
      setApplyingProjectId(null)
    }
  }

  // ... 나머지 코드는 동일 ...
}
