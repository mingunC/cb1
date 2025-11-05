import React from 'react'
import { Calendar, MapPin, FileText, Eye, Plus, Minus, XCircle, User, DollarSign, Clock, Ban } from 'lucide-react'
import { Project } from '@/types/contractor'
import { BUDGET_LABELS, TIMELINE_LABELS } from '@/constants/contractor'
import { 
  getSpaceTypeInfo, 
  getProjectTypeInfo, 
  getVisitDate,
  formatDate,
  isSiteVisitMissed,
  canApplySiteVisit
} from '@/lib/contractor/projectHelpers'
import StatusBadge from './StatusBadge'

interface ProjectCardProps {
  project: Project
  contractorId: string
  onSiteVisitApply: (projectId: string) => void
  onSiteVisitCancel: (applicationId: string, projectId: string) => void
  onQuoteCreate: (project: Project) => void
  onQuoteView: (project: Project) => void
  onBiddingToggle?: (project: Project) => void
}

/**
 * 프로젝트 카드 컴포넌트
 */
const ProjectCard = React.memo(({ 
  project,
  contractorId,
  onSiteVisitApply,
  onSiteVisitCancel,
  onQuoteCreate,
  onQuoteView,
  onBiddingToggle
}: ProjectCardProps) => {
  
  const spaceInfo = getSpaceTypeInfo(project.space_type)
  const visitDate = getVisitDate(project)
  const siteVisitMissed = isSiteVisitMissed(project, contractorId)
  const canApply = canApplySiteVisit(project)

  // 고객 이름 가져오기
  const getCustomerName = () => {
    if (!project.customer) return null
    const { first_name, last_name } = project.customer
    if (first_name || last_name) {
      return `${first_name || ''} ${last_name || ''}`.trim()
    }
    return null
  }

  const customerName = getCustomerName()

  // 미선정 상태일 때 선택된 업체명 표시 여부 확인
  const isNotSelected = project.projectStatus === 'not-selected'
  const selectedContractorName = project.selected_contractor?.company_name

  // 상태별 카드 스타일 (강화된 테두리 + 배경 + 그림자)
  const getCardStyle = () => {
    const status = project.projectStatus
    
    const styles = {
      'selected': 'border-l-[6px] border-green-500 bg-green-50/30 shadow-lg shadow-green-100',
      'bidding': 'border-l-[6px] border-orange-500 bg-orange-50/30 shadow-lg shadow-orange-100',
      'not-selected': 'border-l-[6px] border-red-400 bg-red-50/30 shadow-md shadow-red-50',
      'failed-bid': 'border-l-[6px] border-red-600 bg-red-50/30 shadow-lg shadow-red-100',
      'quoted': 'border-l-[6px] border-purple-500 bg-purple-50/30 shadow-md shadow-purple-50',
      'site-visit-applied': 'border-l-[6px] border-blue-500 bg-blue-50/30 shadow-md shadow-blue-50',
      'site-visit-completed': 'border-l-[6px] border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-50',
      'approved': 'border-l-[6px] border-emerald-400 bg-emerald-50/30 shadow-md shadow-emerald-50',
      'completed': 'border-l-[6px] border-gray-400 bg-gray-50/30 shadow-sm',
      'cancelled': 'border-l-[6px] border-gray-300 bg-gray-50/30 shadow-sm',
      'pending': 'border-l-[6px] border-yellow-400 bg-yellow-50/30 shadow-sm'
    }
    
    return styles[status as keyof typeof styles] || 'border-l-[6px] border-gray-200 bg-white'
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${getCardStyle()}`}>
      {/* 카드 헤더 */}
      <div className="p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900 truncate">
            {spaceInfo.label}
          </h4>
          <StatusBadge status={project.projectStatus!} />
        </div>

        {/* 고객 이름 표시 */}
        {customerName && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <User className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{customerName}</span>
          </div>
        )}
        
        {/* 프로젝트 타입 배지들 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {project.project_types?.map((type, index) => {
            const typeInfo = getProjectTypeInfo(type)
            return (
              <div
                key={index}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
              >
                {typeInfo.label}
              </div>
            )
          }) || (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Project
            </div>
          )}
        </div>
      </div>

      {/* 카드 바디 */}
      <div className="p-4 space-y-3 bg-white/60">
        {/* Budget & Timeline - 세로 배치로 변경 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium">
              {BUDGET_LABELS[project.budget] || project.budget}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium">
              {TIMELINE_LABELS[project.timeline] || project.timeline}
            </span>
          </div>
        </div>

        {/* Visit Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">Visit: {visitDate}</span>
        </div>

        {/* 주소 */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{project.full_address}</span>
        </div>

        {/* 프로젝트 요구사항 */}
        {project.description && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-gray-700">Requirements:</span>
                <p className="mt-1 text-gray-600 line-clamp-3">{project.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* 견적 정보 */}
        {project.contractor_quote && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 font-medium">
              Submitted Quote: ${project.contractor_quote.price.toLocaleString()}
            </p>
            {project.contractor_quote.status === 'accepted' && (
              <p className="text-sm text-green-600 mt-1 font-medium">✓ Customer selected</p>
            )}
          </div>
        )}

        {/* 미선정 상태일 때 선택된 업체명 표시 */}
        {isNotSelected && selectedContractorName && (
          <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
            <p className="text-sm text-orange-800 font-medium">
              Customer selected another contractor.
            </p>
          </div>
        )}
      </div>

      {/* 카드 푸터 - 액션 버튼 */}
      <div className="p-4 bg-gray-50/80 border-t border-gray-100">
        <div className="flex flex-col gap-2">
          
          {/* 현장방문 누락 표시 */}
          {siteVisitMissed && (
            <div className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" />
              Site Visit Missed
            </div>
          )}
          
          {/* 현장방문 신청 버튼 */}
          {canApply && (
            <button
              onClick={() => onSiteVisitApply(project.id)}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Apply Site Visit
            </button>
          )}
          
          {/* 현장방문 취소 버튼 */}
          {project.projectStatus === 'site-visit-applied' && project.site_visit_application && (
            <button
              onClick={() => onSiteVisitCancel(project.site_visit_application!.id, project.id)}
              disabled={project.site_visit_application.is_cancelled}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                project.site_visit_application.is_cancelled
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Minus className="h-4 w-4" />
              {project.site_visit_application.is_cancelled ? 'Cancelled' : 'Cancel Site Visit'}
            </button>
          )}
          
          {/* 입찰 참여/취소 버튼 (Bidding 상태) - ✅ siteVisit으로 체크 변경 */}
          {project.projectStatus === 'bidding' && onBiddingToggle && (
            project.siteVisit ? (
              <button
                onClick={() => onBiddingToggle(project)}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  project.contractor_quote
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {project.contractor_quote ? (
                  <>
                    <Ban className="h-4 w-4" />
                    Cancel Bidding
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Join Bidding
                  </>
                )}
              </button>
            ) : (
              <div className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                <FileText className="h-4 w-4" />
                Site Visit Required
              </div>
            )
          )}
          
          {/* 견적서 작성 버튼 */}
          {project.projectStatus === 'site-visit-completed' && 
           !project.contractor_quote && 
           !siteVisitMissed && (
            <button
              onClick={() => onQuoteCreate(project)}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Write Quote
            </button>
          )}
          
          {/* 견적서 보기 버튼 */}
          {project.projectStatus === 'quoted' && project.contractor_quote && (
            <button
              onClick={() => onQuoteView(project)}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Quote
            </button>
          )}
          
        </div>
      </div>
    </div>
  )
})

ProjectCard.displayName = 'ProjectCard'

export default ProjectCard
