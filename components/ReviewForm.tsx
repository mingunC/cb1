'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/clients'

// Review form schema - rating 제거
const reviewFormSchema = z.object({
  contractor_id: z.string(),
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

export default function ReviewForm({ contractorId, contractorName, onClose, onSuccess }: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasQuoteRequests, setHasQuoteRequests] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      contractor_id: contractorId,
      title: '',
      comment: '',
      photos: []
    }
  })

  // 견적요청 이용 경험 확인만 수행 (업체 계정 체크는 API에서)
  useEffect(() => {
    const checkEligibility = async () => {
      setIsLoading(true)
      
      try {
        const supabase = createBrowserClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('❌ Session error:', sessionError)
          toast.error('Login is required.')
          setTimeout(() => onClose(), 2000)
          return
        }

        // 견적요청 이용 경험 확인
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

        if (result.success) {
          setHasQuoteRequests(result.hasQuoteRequests)
          
          if (!result.hasQuoteRequests) {
            toast.error('견적요청을 이용한 경험이 있어야 리뷰를 작성할 수 있습니다.')
          }
        } else {
          toast.error(result.error || 'Failed to check eligibility.')
        }
      } catch (error) {
        console.error('❌ Check eligibility error:', error)
        toast.error('An error occurred.')
      } finally {
        setIsLoading(false)
      }
    }

    checkEligibility()
  }, [onClose])

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)
    try {
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
        body: JSON.stringify(data),
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
            <p className="text-gray-600">Checking eligibility...</p>
          </div>
        </div>
      </div>
    )
  }

  if (hasQuoteRequests === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Review requires prior quote requests</h3>
            <p className="text-sm text-gray-500 mb-6">You need to have used the quote request process at least once before writing a review.</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
              rows={6}
              placeholder="Please write a detailed review of your experience with this contractor"
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
              disabled={isSubmitting}
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
