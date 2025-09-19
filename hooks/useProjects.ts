// ============================================
// 6. hooks/useProjects.ts - 프로젝트 관리 훅
// ============================================
import { useState, useCallback, useEffect } from 'react'
import { ProjectService } from '@/services/project.service'
export const useProjects = (contractorId: string) => {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const service = new ProjectService()

  const loadProjects = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(!isLoadMore)
      const data = await service.getProjects(
        contractorId, 
        isLoadMore ? offset : 0
      )
      
      if (isLoadMore) {
        setProjects(prev => [...prev, ...data])
      } else {
        setProjects(data)
        setOffset(0)
      }
      
      setHasMore(data.length === 9)
      setOffset(prev => prev + data.length)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [contractorId, offset])

  const refresh = () => loadProjects(false)

  useEffect(() => {
    if (contractorId) loadProjects(false)
  }, [contractorId])

  return { projects, loading, hasMore, loadMore: () => loadProjects(true), refresh }
}
