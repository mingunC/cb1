import React from 'react'
import { ProjectStatus } from '@/types/contractor'
import { STATUS_CONFIGS } from '@/constants/contractor'

interface StatusBadgeProps {
  status: ProjectStatus
}

/**
 * 프로젝트 상태 배지 컴포넌트
 */
const StatusBadge = React.memo(({ status }: StatusBadgeProps) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['pending']
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
})

StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
