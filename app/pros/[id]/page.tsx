'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Star, Award, Calendar, Users, 
  CheckCircle, Phone, Mail, Globe, Clock, Building,
  Briefcase, Shield, ChevronLeft, X, MessageCircle, Image as ImageIcon,
  ArrowLeft, Reply, Edit2, Trash2
} from 'lucide-react'
import Link from 'next/link'
import ReviewForm from '@/components/ReviewForm'
import toast from 'react-hot-toast'

interface Contractor {
  id: string
  company_name: string
  contact_name: string
  phone: string
  email: string
  website?: string
  company_logo?: string
  description?: string
  years_in_business?: number
  specialties?: string[]
  rating?: number
  portfolio_count?: number
  status?: string
  created_at: string
  logo_url?: string
  cover_image?: string
  established_year?: number
  employee_count?: string
  service_areas: string[]
  certifications: string[]
  review_count: number
  completed_projects: number
  response_time?: string
  min_budget?: number
  is_verified: boolean
  is_premium: boolean
}

interface Review {
  id: string
  contractor_id: string
  customer_id: string
  quote_id: string | null
  rating: number
  title: string
  comment: string
  photos: string[]
  is_verified: boolean
  created_at: string
  contractor_reply: string | null
  contractor_reply_date: string | null
  customer: {
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export default function ContractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractorId = params.id as string
  
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [portfolioCount, setPortfolioCount] = useState(0)
  const [completedProjects, setCompletedProjects] = useState(0)
  const [isContractorOwner, setIsContractorOwner] = useState(false)
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  useEffect(() => {
    if (contractorId) {
      fetchContractorDetails()
      fetchReviews()
      checkContractorOwnership()
    }
  }, [contractorId])

  const checkContractorOwnership = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: contractorData } = await supabase
        .from('contractors')
        .select('user_id')
        .eq('id', contractorId)
        .single()

      if (contractorData && contractorData.user_id === user.id) {
        setIsContractorOwner(true)
      }
    } catch (error) {
      console.error('Error checking ownership:', error)
    }
  }

  const fetchContractorDetails = async () => {
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      const { data: contractorData, error } = await supabase
        .from('contractors')
        .select(`
          id,
          company_name,
          contact_name,
          phone,
          email,
          address,
          website,
          company_logo,
          description,
          years_in_business,
          specialties,
          rating,
          status,
          created_at
        `)
        .eq('id', contractorId)
        .single()

      if (error) {
        console.error('Error fetching contractor:', error)
        return
      }

      // 포트폴리오 개수
      const { count: portfolioCount } = await supabase
        .from('portfolios')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', contractorId)

      // 완료 프로젝트 수
      const { count: completedQuotes } = await supabase
        .from('contractor_quotes')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', contractorId)
        .in('status', ['completed', 'accepted'])

      // Review count
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', contractorId)

      setPortfolioCount(portfolioCount || 0)
      setCompletedProjects(completedQuotes || 0)

      const formattedContractor: Contractor = {
        id: contractorData.id,
        company_name: contractorData.company_name || 'No company name',
        contact_name: contractorData.contact_name || 'No contact person',
        phone: contractorData.phone || 'No phone number',
        email: contractorData.email || 'No email',
        website: contractorData.website,
        logo_url: contractorData.company_logo,
        cover_image: contractorData.company_logo,
        description: contractorData.description || 'No company description provided.',
        established_year: contractorData.years_in_business ? new Date().getFullYear() - contractorData.years_in_business : undefined,
        employee_count: '정보 없음',
        service_areas: contractorData.address ? [contractorData.address] : ['Seoul', 'Gyeonggi'],
        specialties: Array.isArray(contractorData.specialties) ? contractorData.specialties : [],
        certifications: ['Interior construction license'],
        rating: contractorData.rating || 0,
        review_count: reviewCount || 0,
        completed_projects: completedQuotes || 0,
        response_time: 'We will contact you shortly',
        min_budget: undefined,
        is_verified: true,
        is_premium: false,
        portfolio_count: portfolioCount || 0,
        created_at: contractorData.created_at
      }

      setContractor(formattedContractor)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const supabase = createBrowserClient()
      
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          id,
          contractor_id,
          customer_id,
          quote_id,
          rating,
          title,
          comment,
          photos,
          is_verified,
          created_at,
          contractor_reply,
          contractor_reply_date,
          users!customer_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      const formattedReviews: Review[] = (reviewsData || []).map((review: any) => ({
        id: review.id,
        contractor_id: review.contractor_id,
        customer_id: review.customer_id,
        quote_id: review.quote_id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        photos: Array.isArray(review.photos) ? review.photos : [],
        is_verified: review.is_verified,
        created_at: review.created_at,
        contractor_reply: review.contractor_reply,
        contractor_reply_date: review.contractor_reply_date,
        customer: {
          first_name: review.users?.first_name || null,
          last_name: review.users?.last_name || null,
          email: review.users?.email || 'Anonymous'
        }
      }))

      setReviews(formattedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim() || replyText.length < 10) {
      toast.error('답글은 최소 10자 이상이어야 합니다.')
      return
    }

    setIsSubmittingReply(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      const isEditing = editingReplyId === reviewId
      const url = `/api/reviews/${reviewId}/reply`
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reply_text: replyText })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(isEditing ? '답글이 수정되었습니다.' : '답글이 작성되었습니다.')
        setReplyingToReviewId(null)
        setEditingReplyId(null)
        setReplyText('')
        fetchReviews()
      } else {
        toast.error(result.error || '답글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Reply submit error:', error)
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (reviewId: string) => {
    if (!confirm('답글을 삭제하시겠습니까?')) return

    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('로그인이 필요합니다.')
        return
      }

      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        toast.success('답글이 삭제되었습니다.')
        fetchReviews()
      } else {
        toast.error(result.error || '답글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Reply delete error:', error)
      toast.error('오류가 발생했습니다.')
    }
  }

  const handleSMSConsultation = (contractor: Contractor) => {
    const message = encodeURIComponent(`[${contractor.company_name}] Requesting a consultation/quote.`)
    const phoneNumber = contractor.phone.replace(/[^0-9]/g, '')
    const smsURI = `sms:${phoneNumber}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${message}`
    window.location.href = smsURI
  }

  const handleReviewSuccess = () => {
    fetchReviews()
    fetchContractorDetails()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Contractor not found.</p>
          <Link href="/pros" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700">
            Back to contractors
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : contractor.rating || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Cover image */}
      <div className="relative h-64">
        {contractor.cover_image ? (
          <img src={contractor.cover_image} alt={contractor.company_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-4xl font-bold mb-2">{contractor.company_name}</h2>
              <p className="text-emerald-100 text-lg">Professional Services</p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contractor header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 -mt-20 relative z-10">
          <div className="flex items-start gap-4 mb-6">
            {contractor.logo_url ? (
              <img src={contractor.logo_url} alt={contractor.company_name} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {contractor.company_name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{contractor.company_name}</h1>
                {contractor.is_verified && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="ml-0">({reviews.length} reviews)</span>
                </div>
                {contractor.established_year && <span>Established in {contractor.established_year}</span>}
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6">{contractor.description}</p>

          {/* Specialties */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {contractor.specialties.length > 0 ? (
                contractor.specialties.map((specialty, index) => (
                  <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                    {specialty}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No specialty information</span>
              )}
            </div>
          </div>

          {/* Service areas */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Service Areas</h3>
            <div className="flex flex-wrap gap-2">
              {contractor.service_areas.map((area, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{contractor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{contractor.email}</span>
              </div>
              {contractor.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {contractor.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link href={`/portfolio?contractor=${contractor.id}`} className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium flex items-center justify-center gap-2">
                <ImageIcon className="h-5 w-5" />
                View Portfolio
              </Link>
              <button onClick={() => handleSMSConsultation(contractor)} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Request Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
            {!isContractorOwner && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
              >
                Write a Review
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {review.customer.first_name && review.customer.last_name
                            ? `${review.customer.first_name} ${review.customer.last_name}`
                            : review.customer.email?.split('@')[0] || '익명'}
                        </span>
                        {review.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
          <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            className={`h-4 w-4 ${
                              rating <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
        <span className="text-sm text-gray-500">
          {new Date(review.created_at).toLocaleDateString('en-CA')}
        </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                  
                  {review.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
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

                  {/* 업체 답글 */}
                  {review.contractor_reply && (
                    <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Reply className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-sm text-gray-700">
                            {contractor.company_name} 답글
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(review.contractor_reply_date!).toLocaleDateString('en-CA')}
                          </span>
                          {isContractorOwner && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingReplyId(review.id)
                                  setReplyText(review.contractor_reply!)
                                  setReplyingToReviewId(review.id)
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="답글 수정"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReply(review.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="답글 삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {review.contractor_reply}
                      </p>
                    </div>
                  )}

                  {/* 답글 작성 폼 */}
                  {isContractorOwner && !review.contractor_reply && (
                    <div className="mt-4 ml-8">
                      {replyingToReviewId === review.id ? (
                        <div>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="리뷰에 대한 답글을 작성하세요... (최소 10자)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSubmitReply(review.id)}
                              disabled={isSubmittingReply}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50"
                            >
                              {isSubmittingReply ? '제출 중...' : '답글 작성'}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToReviewId(null)
                                setReplyText('')
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingToReviewId(review.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <Reply className="h-4 w-4" />
                          답글 달기
                        </button>
                      )}
                    </div>
                  )}

                  {/* 답글 수정 폼 */}
                  {isContractorOwner && editingReplyId === review.id && replyingToReviewId === review.id && (
                    <div className="mt-4 ml-8">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSubmitReply(review.id)}
                          disabled={isSubmittingReply}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50"
                        >
                          {isSubmittingReply ? '수정 중...' : '답글 수정'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingReplyId(null)
                            setReplyingToReviewId(null)
                            setReplyText('')
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 후기 작성 모달 */}
      {showReviewForm && contractor && (
        <ReviewForm
          contractorId={contractor.id}
          contractorName={contractor.company_name}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}
