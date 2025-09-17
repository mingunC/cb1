import React from 'react'
import { ProjectStatus } from '@/types/contractor'
import { FILTER_OPTIONS } from '@/constants/contractor'

interface ProjectFiltersProps {
  currentFilter: ProjectStatus | 'all'
  onFilterChange: (filter: ProjectStatus | 'all') => void
  statusCounts: Record<ProjectStatus | 'all', number>
}

/**
 * 프로젝트 필터 컴포넌트
 */
const ProjectFilters = React.memo(({ 
  currentFilter, 
  onFilterChange, 
  statusCounts 
}: ProjectFiltersProps) => {
  
  const getFilterLabel = (status: string) => {
    const labels: Record<string, string> = {
      'all': '전체',
      'approved': '승인됨',
      'site-visit-applied': '현장방문 신청',
      'site-visit-completed': '현장방문 완료',
      'quoted': '견적 제출',
      'selected': '선택됨',
      'not-selected': '미선택'
    }
    return labels[status] || status
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => onFilterChange(status as ProjectStatus | 'all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getFilterLabel(status)}
            <span className="ml-2 text-xs">
              ({statusCounts[status as ProjectStatus | 'all']})
            </span>
          </button>
        ))}
      </div>
    </div>
  )
})

ProjectFilters.displayName = 'ProjectFilters'

export default ProjectFilters
