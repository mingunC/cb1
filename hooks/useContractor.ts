import { useState, useEffect, useCallback } from 'react'
import { Project, ProjectStatus } from '@/types/contractor'
import { fetchProjects } from '@/lib/api/contractor'
import { ITEMS_PER_PAGE } from '@/constants/contractor'
import { toast } from 'react-hot-toast'
import { debugLog } from '@/lib/contractor/projectHelpers'

/**
 * 프로젝트 데이터 관리 훅
 */
export const useProjectsData = (contractorId: string | undefined) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)

  // 데이터 페칭 함수
  const loadProjects = useCallback(async (
    offset: number = 0, 
    isLoadMore: boolean = false
  ) => {
    if (!contractorId) return

    debugLog('🚀 loadProjects 시작:', { contractorId, offset, isLoadMore })

    try {
      if (!isLoadMore) {
        setError(null)
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const newProjects = await fetchProjects(contractorId, offset, ITEMS_PER_PAGE)
      
      if (isLoadMore) {
        setProjects(prev => [...prev, ...newProjects])
        setCurrentOffset(prev => prev + ITEMS_PER_PAGE)
      } else {
        setProjects(newProjects)
        setCurrentOffset(ITEMS_PER_PAGE)
      }

      const hasMoreData = newProjects.length === ITEMS_PER_PAGE
      setHasMore(hasMoreData)

      debugLog('✅ loadProjects 완료:', { 
        loadedCount: newProjects.length,
        hasMoreData 
      })

    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      setError('프로젝트 데이터를 불러오는데 실패했습니다.')
      toast.error('데이터 로드 실패')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [contractorId])

  // 데이터 새로고침
  const refreshData = useCallback(async () => {
    setCurrentOffset(0)
    setHasMore(true)
    await loadProjects(0, false)
    toast.success('데이터를 새로고침했습니다')
  }, [loadProjects])

  // 추가 데이터 로드
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    await loadProjects(currentOffset, true)
  }, [currentOffset, hasMore, isLoadingMore, loadProjects])

  return {
    projects,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    refreshData,
    loadMore,
    setProjects
  }
}

/**
 * 무한 스크롤 훅
 */
export const useInfiniteScroll = (
  loadMore: () => void,
  isLoadingMore: boolean,
  hasMore: boolean
) => {
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.offsetHeight
    
    const isNearBottom = scrollTop + windowHeight >= documentHeight - 1000
    
    if (isNearBottom && !isLoadingMore && hasMore) {
      debugLog('🚀 스크롤로 인한 추가 로드')
      loadMore()
    }
  }, [loadMore, isLoadingMore, hasMore])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
}

/**
 * 프로젝트 필터링 훅
 */
export const useProjectFilter = (projects: Project[]) => {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')

  const filteredProjects = projects.filter(p => 
    filter === 'all' ? true : p.projectStatus === filter
  )

  const statusCounts: Record<ProjectStatus | 'all', number> = {
    'all': projects.length,
    'pending': 0,
    'approved': 0,
    'site-visit-applied': 0,
    'site-visit-completed': 0,
    'quoted': 0,
    'selected': 0,
    'not-selected': 0,
    'completed': 0,
    'cancelled': 0
  }

  projects.forEach(p => {
    if (p.projectStatus) {
      statusCounts[p.projectStatus]++
    }
  })

  return {
    filter,
    setFilter,
    filteredProjects,
    statusCounts
  }
}
