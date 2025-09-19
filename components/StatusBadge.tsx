// ============================================
// 5. components/StatusBadge.tsx - 재사용 컴포넌트
// ============================================
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/project-status'
export const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
