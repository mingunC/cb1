'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, X, Camera, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/clients'

// 리뷰 작성 스키마
const reviewFormSchema = z.object({
  contractor_id: z.string(),
  quote_id: z.string(),
  rating: z.number().min(1, '별점을 선택해주세요'),
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이하로 입력해주세요'),
  comment: z.string().min(10, '리뷰 내용은 최소 10자 이상 입력해주세요').max(1000, '리뷰 내용은 1000자 이하로 입력해주세요'),
  photos: z.array(z.string()).optional().default([])
})

type ReviewFormData = z.infer<typeof reviewFormSchema>

interface ReviewFormProps {
  contractorId: string
  contractorName: string
  onClose: () => void
  onSuccess?: () => void
}

interface AvailableQuote {
  id: string
  price: number
  description: string | null
  status: string
  created_at: string
  contractors: {
    id: string
    company_name: string
    contact_name: string
  }
  quote_requests: {
    id: string
    space_type: string
    budget: string
    full_address?: string
    address?: string
  }
}

export default function ReviewForm({ contractorId, contractorName, onClose, onSuccess }: ReviewFormProps) {
  const [availableQuotes, setAvailableQuotes] = useState<AvailableQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<AvailableQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      contractor_id: contractorId,
      rating: 0,
      title: '',
      comment: '',
      photos: []
    }
  })

  const watchedRating = watch('rating')

  // 사용자가 리뷰를 남길 수 있는 견적서 목록 조회
  useEffect(() => {
    const fetchAvailableQuotes = async () => {
      setIsLoading(true)
      try {
        console.log('🔍 Fetching available quotes for contractor:', contractorId)
        
        // ✅ 클라이언트에서 세션 토큰 가져오기
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          toast.error('로그인이 필요합니다.')
          setTimeout(() => onClose(), 1000)
          return
        }

        const response = await fetch('/api/reviews', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${session.access_token}` // ✅ 토큰 전달
          }
        })
        const result = await response.json()

        console.log('📦 API Response:', result)

        if (result.success) {
          console.log('✅ Total quotes received:', result.data.length)
          
          // 해당 업체의 견적서만 필터링
          const contractorQuotes = result.data.filter((quote: AvailableQuote) => {
            const matches = quote.contractors.id === contractorId
            console.log(`🔍 Quote ${quote.id}: contractor ${quote.contractors.id} ${matches ? '✅ MATCH' : '❌ NO MATCH'}`)
            return matches
          })
          
          console.log('✅ Filtered contractor quotes:', contractorQuotes.length, contractorQuotes)
          setAvailableQuotes(contractorQuotes)
          
          if (contractorQuotes.length === 0) {
            console.warn('⚠️ No completed projects found for this contractor')
            toast.error('리뷰를 남길 수 있는 완료된 공사가 없습니다.')
            setTimeout(() => onClose(), 3000)
          }
        } else {
          console.error('❌ API Error:', result.error)
          toast.error(result.error || '견적서 조회에 실패했습니다.')
        }
      } catch (error) {
        console.error('❌ 견적서 조회 오류:', error)
        toast.error('견적서 조회 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableQuotes()
  }, [contractorId, onClose])

  const handleRatingClick = (rating: number) => {
    setValue('rating', rating)
  }

  const handleQuoteSelect = (quote: AvailableQuote) => {
    setSelectedQuote(quote)
    setValue('quote_id', quote.id)
  }

  const onSubmit = async (data: ReviewFormData) => {
    if (!selectedQuote) {
      toast.error('견적서를 선택해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      // ✅ 클라이언트에서 세션 토큰 가져오기
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // ✅ 토큰 전달
        },
        body: JSON.stringify({
          ...data,
          quote_id: selectedQuote.id
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('리뷰가 성공적으로 작성되었습니다!')
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || '리뷰 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('리뷰 작성 오류:', error)
      toast.error('리뷰 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">견적서를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {contractorName} 리뷰 작성
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* 견적서 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리뷰를 남길 공사 선택 * {availableQuotes.length > 0 && `(${availableQuotes.length}개)`}
            </label>
            {availableQuotes.length === 0 ? (
              <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                리뷰를 남길 수 있는 완료된 공사가 없습니다.
              </div>
            ) : (
              <>
                <select
                  value={selectedQuote?.id || ''}
                  onChange={(e) => {
                    const quote = availableQuotes.find(q => q.id === e.target.value)
                    if (quote) {
                      handleQuoteSelect(quote)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                >
                  <option value="">-- 프로젝트를 선택해주세요 --</option>
                  {availableQuotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quote_requests.space_type} 리노베이션 - {quote.quote_requests.full_address || quote.quote_requests.address || '주소 정보 없음'} (${quote.price.toLocaleString()}) - {new Date(quote.created_at).toLocaleDateString('ko-KR')}
                    </option>
                  ))}
                </select>
                {selectedQuote && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedQuote.quote_requests.space_type} 리노베이션
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedQuote.quote_requests.full_address || selectedQuote.quote_requests.address || '주소 정보 없음'}
                        </p>
                        {selectedQuote.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {selectedQuote.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${selectedQuote.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedQuote.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {errors.quote_id && (
              <p className="text-red-500 text-sm mt-1">{errors.quote_id.message}</p>
            )}
          </div>

          {/* 별점 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              별점 *
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= watchedRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리뷰 제목 *
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="리뷰 제목을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* 리뷰 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리뷰 내용 *
            </label>
            <textarea
              {...register('comment')}
              rows={4}
              placeholder="공사 경험에 대한 자세한 리뷰를 작성해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {errors.comment && (
              <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              최소 10자 이상, 최대 1000자까지 입력 가능합니다.
            </p>
          </div>

          {/* 제출 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedQuote || availableQuotes.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  작성 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  리뷰 작성
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
