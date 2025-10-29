import React from 'react'
import { ProjectStatus } from '@/types/contractor'
import { FILTER_OPTIONS } from '@/constants/contractor'

interface ProjectFiltersProps {
  currentFilter: ProjectStatus | 'all' | 'bidding'
  onFilterChange: (filter: ProjectStatus | 'all' | 'bidding') => void
  statusCounts: Record<ProjectStatus | 'all' | 'bidding', number>
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
      'all': 'All',
      'bidding': 'Bidding',
      'approved': 'Approved',
      'site-visit-applied': 'Site Visit Applied',
      'site-visit-completed': 'Site Visit Completed',
      'quoted': 'Quote Submitted',
      'selected': 'Selected',
      'not-selected': 'Not Selected'
    }
    return labels[status] || status
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => onFilterChange(status as ProjectStatus | 'all' | 'bidding')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentFilter === status
                ? status === 'bidding'
                  ? 'bg-orange-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getFilterLabel(status)}
            <span className="ml-2 text-xs">
              ({statusCounts[status as ProjectStatus | 'all' | 'bidding']})
            </span>
          </button>
        ))}
      </div>
    </div>
  )
})

ProjectFilters.displayName = 'ProjectFilters'

export default ProjectFilters
