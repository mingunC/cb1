'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, X, Camera, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/clients'

// Review form schema
const reviewFormSchema = z.object({
  contractor_id: z.string(),
  quote_id: z.string(),
  rating: z.number().min(0.5, 'Please select a rating'),
  title: z.string().min(1, 'Please enter a title').max(100, 'Title must be 100 characters or less'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review must be 1000 characters or less'),
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
  const [loadError, setLoadError] = useState<string | null>(null)

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

  // Fetch quotes that the user can review
  useEffect(() => {
    const fetchAvailableQuotes = async () => {
      setIsLoading(true)
      setLoadError(null)
      
      try {
        console.log('🔍 Fetching available quotes for contractor:', contractorId)
        
        // ✅ 클라이언트에서 세션 토큰 가져오기
        const supabase = createBrowserClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('❌ Session error:', sessionError)
          setLoadError('Login is required.')
          toast.error('Login is required.')
          setTimeout(() => onClose(), 2000)
          return
        }

        const response = await fetch('/api/reviews', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
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
            console.warn('⚠️ No eligible projects found for this contractor')
            setLoadError('There are no projects available to review.')
            toast.error('There are no projects available to review.')
          }
        } else {
          console.error('❌ API Error:', result.error)
          setLoadError(result.error || 'Failed to fetch quotes.')
          toast.error(result.error || 'Failed to fetch quotes.')
        }
      } catch (error) {
        console.error('❌ Fetch quotes error:', error)
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching quotes.'
        setLoadError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableQuotes()
  }, [contractorId, onClose])

  const getFillPercent = (starIndex: number) => {
    const value = watch('rating') || 0
    const diff = value - (starIndex - 1)
    return Math.max(0, Math.min(100, diff * 100))
  }

  const handleStarClick = (index: number, e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    let clientX: number | null = null

    // Mouse
    if ('nativeEvent' in e && (e as any).nativeEvent && (e as any).nativeEvent.clientX !== undefined) {
      clientX = (e as any).nativeEvent.clientX
    }
    // Touch
    if (clientX === null && 'changedTouches' in e && (e as React.TouchEvent<HTMLButtonElement>).changedTouches?.length) {
      clientX = (e as React.TouchEvent<HTMLButtonElement>).changedTouches[0].clientX
    }

    const isHalf = clientX !== null ? (clientX - rect.left) < rect.width / 2 : false
    const value = isHalf ? index - 0.5 : index
    setValue('rating', value, { shouldValidate: true })
  }

  const handleQuoteSelect = (quote: AvailableQuote) => {
    setSelectedQuote(quote)
    setValue('quote_id', quote.id)
  }

  const onSubmit = async (data: ReviewFormData) => {
    if (!selectedQuote) {
      toast.error('Please select a quote.')
      return
    }

    setIsSubmitting(true)
    try {
      // ✅ 클라이언트에서 세션 토큰 가져오기
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Login is required.')
        return
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...data,
          quote_id: selectedQuote.id
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Your review has been submitted!')
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || 'Failed to submit review.')
      }
    } catch (error) {
      console.error('Review submit error:', error)
      toast.error('An error occurred while submitting your review.')
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
            <p className="text-gray-600">Loading quotes...</p>
          </div>
        </div>
      </div>
    )
  }

  // ✅ 로딩 완료 후 에러가 있으면 에러 상태 표시
  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Reviews</h3>
            <p className="text-sm text-gray-500 mb-6">{loadError}</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Write a Review for {contractorName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Quote selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a project to review * {availableQuotes.length > 0 && `(${availableQuotes.length})`}
            </label>
            {availableQuotes.length === 0 ? (
              <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                There are no projects available to review.
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
                  <option value="">-- Please select a project --</option>
                  {availableQuotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quote_requests.space_type} Renovation - {quote.quote_requests.full_address || quote.quote_requests.address || 'Address not available'} (${quote.price.toLocaleString()}) - {new Date(quote.created_at).toLocaleDateString('en-CA')}
                    </option>
                  ))}
                </select>
                {selectedQuote && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedQuote.quote_requests.space_type} Renovation
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedQuote.quote_requests.full_address || selectedQuote.quote_requests.address || 'Address not available'}
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
                          {new Date(selectedQuote.created_at).toLocaleDateString('en-CA')}
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

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rating *
            </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleStarClick(idx, e)}
                onTouchEnd={(e) => handleStarClick(idx, e)}
                className="relative focus:outline-none h-8 w-8"
                aria-label={`Rate ${idx} star${idx > 1 ? 's' : ''}`}
              >
                {/* Base (empty) star */}
                <Star className="absolute inset-0 h-8 w-8 text-gray-300" />
                {/* Filled portion */}
                <div
                  className="absolute top-0 left-0 h-8 overflow-hidden"
                  style={{ width: `${getFillPercent(idx)}%` }}
                >
                  <Star className="h-8 w-8 text-yellow-400 fill-current" />
                </div>
              </button>
            ))}
          </div>
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review title *
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Enter review title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Review content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review content *
            </label>
            <textarea
              {...register('comment')}
              rows={4}
              placeholder="Please write a detailed review of your project experience"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {errors.comment && (
              <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters, maximum 1000 characters.
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedQuote || availableQuotes.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
