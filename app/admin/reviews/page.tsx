'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  ArrowLeft, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Search,
  MessageCircle,
  User,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Review {
  id: string
  contractor_id: string
  customer_id: string
  quote_id: string | null
  rating: number | null
  title: string
  comment: string
  photos: string[]
  is_verified: boolean
  created_at: string
  contractor_reply: string | null
  contractor_reply_date: string | null
  contractors: {
    id: string
    company_name: string
  }
  users: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterReply, setFilterReply] = useState<'all' | 'with' | 'without'>('all')
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    comment: '',
    contractor_reply: '',
    is_verified: false
  })
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    checkAuthorization()
  }, [])

  useEffect(() => {
    if (isAuthorized && accessToken) {
      fetchReviews()
    }
  }, [isAuthorized, accessToken])

  useEffect(() => {
    filterReviews()
  }, [reviews, searchTerm, filterReply])

  const checkAuthorization = async () => {
    try {
      console.log('🔍 Checking authorization...')
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('❌ No session found')
        router.push('/login')
        return
      }

      console.log('✅ Session found:', session.user.email)
      console.log('🔑 Access token:', session.access_token ? 'present' : 'missing')

      if (session.user.email !== 'cmgg919@gmail.com') {
        console.error('❌ Not admin:', session.user.email)
        toast.error('관리자 권한이 필요합니다')
        router.push('/')
        return
      }

      console.log('✅ Admin authorized')
      setAccessToken(session.access_token)
      setIsAuthorized(true)
    } catch (error) {
      console.error('❌ Authorization error:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      console.log('📥 Fetching reviews...')
      console.log('🔑 Using access token:', accessToken ? 'yes' : 'no')
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/reviews', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      console.log('📊 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 Received data:', data)

      if (data.reviews) {
        console.log(`✅ Loaded ${data.reviews.length} reviews`)
        setReviews(data.reviews)
      } else {
        console.warn('⚠️ No reviews in response')
        setReviews([])
      }
    } catch (error: any) {
      console.error('❌ Error fetching reviews:', error)
      const errorMessage = error.message || '리뷰를 불러오는데 실패했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const filterReviews = () => {
    let filtered = reviews

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.contractors.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.users.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 답글 필터
    if (filterReply === 'with') {
      filtered = filtered.filter(review => review.contractor_reply)
    } else if (filterReply === 'without') {
      filtered = filtered.filter(review => !review.contractor_reply)
    }

    setFilteredReviews(filtered)
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('정말 이 리뷰를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()

      if (data.success) {
        toast.success('리뷰가 삭제되었습니다')
        fetchReviews()
      } else {
        toast.error(data.error || '리뷰 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('리뷰 삭제에 실패했습니다')
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    setEditFormData({
      title: review.title,
      comment: review.comment,
      contractor_reply: review.contractor_reply || '',
      is_verified: review.is_verified
    })
  }

  const handleUpdate = async () => {
    if (!editingReview) return

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          id: editingReview.id,
          ...editFormData
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('리뷰가 수정되었습니다')
        setEditingReview(null)
        fetchReviews()
      } else {
        toast.error(data.error || '리뷰 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('리뷰 수정에 실패했습니다')
    }
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setEditFormData({
      title: '',
      comment: '',
      contractor_reply: '',
      is_verified: false
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                대시보드
              </button>
              <h1 className="text-xl font-bold">리뷰 관리</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span>전체 {reviews.length}개</span>
              {error && (
                <button
                  onClick={fetchReviews}
                  className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  재시도
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">오류 발생</h3>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.
              </p>
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="제목, 내용, 업체명, 고객 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterReply('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterReply === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterReply('with')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterReply === 'with'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                답글 있음
              </button>
              <button
                onClick={() => setFilterReply('without')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterReply === 'without'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                답글 없음
              </button>
            </div>
          </div>
        </div>

        {/* 리뷰 목록 */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterReply !== 'all' 
                  ? '검색 결과가 없습니다' 
                  : '리뷰가 없습니다'}
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                {editingReview?.id === review.id ? (
                  // 수정 모드
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        제목
                      </label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        내용
                      </label>
                      <textarea
                        value={editFormData.comment}
                        onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        업체 답글
                      </label>
                      <textarea
                        value={editFormData.contractor_reply}
                        onChange={(e) => setEditFormData({ ...editFormData, contractor_reply: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="업체 답글을 입력하세요..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_verified"
                        checked={editFormData.is_verified}
                        onChange={(e) => setEditFormData({ ...editFormData, is_verified: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="is_verified" className="text-sm text-gray-700">
                        인증된 리뷰로 표시
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={handleUpdate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4" />
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <X className="h-4 w-4" />
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{review.title}</h3>
                          {review.is_verified && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              인증됨
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {review.contractors.company_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {review.users.first_name && review.users.last_name
                              ? `${review.users.first_name} ${review.users.last_name}`
                              : review.users.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(review.created_at).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(review)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* 업체 답글 */}
                    {review.contractor_reply && (
                      <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-sm text-gray-700">업체 답글</span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.contractor_reply_date!).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{review.contractor_reply}</p>
                      </div>
                    )}

                    {/* 사진 */}
                    {review.photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {review.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
