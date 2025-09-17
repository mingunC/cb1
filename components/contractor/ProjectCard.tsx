import React from 'react'
import { Calendar, MapPin, FileText, Eye, Plus, Minus, XCircle } from 'lucide-react'
import { Project } from '@/types/contractor'
import { BUDGET_LABELS, TIMELINE_LABELS } from '@/constants/contractor'
import { 
  getSpaceTypeInfo, 
  getProjectTypeInfo, 
  getVisitDate,
  formatDate,
  isSiteVisitMissed,
  canApplySiteVisit,
  debugLog
} from '@/lib/contractor/projectHelpers'
import StatusBadge from './StatusBadge'

interface ProjectCardProps {
  project: Project
  contractorId: string
  onSiteVisitApply: (projectId: string) => void
  onSiteVisitCancel: (applicationId: string, projectId: string) => void
  onQuoteCreate: (project: Project) => void
  onQuoteView: (project: Project) => void
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
  onQuoteView
}: ProjectCardProps) => {
  
  const spaceInfo = getSpaceTypeInfo(project.space_type)
  const visitDate = getVisitDate(project)
  const siteVisitMissed = isSiteVisitMissed(project, contractorId)
  const canApply = canApplySiteVisit(project)

  // 디버깅 로그
  debugLog('🔴 현장방문 버튼 조건:', {
    projectId: project.id,
    projectStatus: project.status,
    canApply
  })

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* 카드 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900 truncate">
            {spaceInfo.label}
          </h4>
          <StatusBadge status={project.projectStatus!} />
        </div>
        
        {/* 프로젝트 타입 배지들 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {project.project_types?.map((type, index) => {
            const typeInfo = getProjectTypeInfo(type)
            return (
              <div
                key={index}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${typeInfo.color}`}
              >
                {typeInfo.label}
              </div>
            )
          }) || (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              프로젝트
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">예산: </span>
          {BUDGET_LABELS[project.budget] || project.budget}
        </div>
      </div>

      {/* 카드 바디 */}
      <div className="p-4 space-y-3">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium text-xs">일정</span>
            <span className="text-gray-900 font-medium">
              {TIMELINE_LABELS[project.timeline] || project.timeline}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium text-xs">방문일</span>
            <span className="text-gray-900 font-medium">{visitDate}</span>
          </div>
        </div>

        {/* 주소 */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{project.full_address}</span>
        </div>

        {/* 프로젝트 요구사항 */}
        {project.description && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-gray-700">요구사항:</span>
              <p className="mt-1 text-gray-600 line-clamp-3">{project.description}</p>
            </div>
          </div>
        )}

        {/* 등록일 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>등록일: {formatDate(project.created_at)}</span>
        </div>

        {/* 견적 정보 */}
        {project.contractor_quote && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 font-medium">
              제출 견적: ${project.contractor_quote.price.toLocaleString()}
            </p>
            {project.contractor_quote.status === 'accepted' && (
              <p className="text-sm text-green-600 mt-1 font-medium">✓ 고객이 선택했습니다</p>
            )}
          </div>
        )}
      </div>

      {/* 카드 푸터 - 액션 버튼 */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-col gap-2">
          
          {/* 현장방문 누락 표시 */}
          {siteVisitMissed && (
            <div className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" />
              현장방문 누락
            </div>
          )}
          
          {/* 현장방문 신청 버튼 */}
          {canApply && (
            <button
              onClick={() => onSiteVisitApply(project.id)}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              현장방문 신청
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
              {project.site_visit_application.is_cancelled ? '취소됨' : '현장방문 취소'}
            </button>
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
              견적서 작성
            </button>
          )}
          
          {/* 견적서 보기 버튼 */}
          {project.projectStatus === 'quoted' && project.contractor_quote && (
            <button
              onClick={() => onQuoteView(project)}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Eye className="h-4 w-4" />
              견적서 보기
            </button>
          )}
          
        </div>
      </div>
    </div>
  )
})

ProjectCard.displayName = 'ProjectCard'

export default ProjectCard
