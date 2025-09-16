// ============================================
// 7. 간소화된 contractor/page.tsx
// ============================================
'use client'

import { useAuth } from '@/lib/supabase/hooks'
import { useProjects } from '@/hooks/useProjects'
import { StatusBadge } from '@/components/StatusBadge'
import { ProjectService } from '@/services/project.service'
import { toast } from 'react-hot-toast'

export default function ContractorDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { projects, loading, hasMore, loadMore, refresh } = useProjects(user?.contractorId)
  const service = new ProjectService()

  const handleSiteVisit = async (projectId: string) => {
    try {
      await service.applySiteVisit(projectId, user.contractorId)
      toast.success('현장방문 신청 완료')
      refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (authLoading || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">프로젝트 관리</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{project.space_type}</h3>
              <StatusBadge status={project.status} />
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{project.full_address}</p>
            
            {/* 조건부 버튼 렌더링 - 간소화 */}
            {project.status === 'approved' && !project.my_site_visit && (
              <button 
                onClick={() => handleSiteVisit(project.id)}
                className="w-full bg-blue-600 text-white rounded py-2"
              >
                현장방문 신청
              </button>
            )}
            
            {project.status === 'bidding' && !project.my_quote && (
              <button className="w-full bg-green-600 text-white rounded py-2">
                견적서 작성
              </button>
            )}
          </div>
        ))}
      </div>
      
      {hasMore && (
        <button onClick={loadMore} className="mt-6 mx-auto block">
          더 보기
        </button>
      )}
    </div>
  )
}
