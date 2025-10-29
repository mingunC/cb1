'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { getQuoteRequests } from '@/lib/supabase/quotes'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Download, FileText, Building, User, Home, Play, Loader, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QuoteRequest {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date: string
  full_address: string
  postal_code: string
  description: string
  photos: string[]
  status: 'pending' | 'approved' | 'rejected' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted' | 'contractor-selected' | 'in-progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  contractor_quotes?: ContractorQuote[]
  site_visit_applications?: SiteVisitApplication[]
  project_started_at?: string
  project_completed_at?: string
  selected_contractor_id?: string
}

interface SiteVisitApplication {
  id: string
  contractor_id: string
  status: 'pending' | 'approved' | 'cancelled'
  notes?: string
  applied_at: string
  created_at: string
  updated_at: string
  contractors?: {
    id: string
    company_name: string
    contact_name: string
    phone: string
    email: string
  }
}

interface ContractorQuote {
  id: string
  project_id: string
  contractor_id: string
  bid_amount: number
  bid_description: string
  pdf_url: string
  pdf_filename?: string
  valid_until: string
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'selected' | 'expired'
  created_at: string
  contractor_name?: string
  contractor_company?: string
  price?: number
  description?: string
  contractors?: {
    id: string
    company_name: string
    contact_name: string
    phone: string
    email: string
  }
}

export default function MyQuotesPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [contractorQuotes, setContractorQuotes] = useState<ContractorQuote[]>([])
  const [quotesTableData, setQuotesTableData] = useState<any[]>([])
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)
  const [downloadingQuotes, setDownloadingQuotes] = useState<Set<string>>(new Set())
  const [startingProject, setStartingProject] = useState<string | null>(null)
  const [selectingContractor, setSelectingContractor] = useState<string | null>(null)
  const [collapsedQuotes, setCollapsedQuotes] = useState<Set<string>>(new Set())
  const [collapsedSiteVisits, setCollapsedSiteVisits] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        console.log('Checking user type for user ID:', user.id, 'Email:', user.email)
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_type, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()

        console.log('User type check result:', { userData, userError })

        let userType = 'customer'
        if (userData && userData.user_type) {
          userType = userData.user_type
        } else if (userError && userError.code === 'PGRST116') {
          console.log('User not found in users table, treating as customer')
          userType = 'customer'
        } else if (userError) {
          console.log('Error checking user type:', userError)
          userType = 'customer'
        }

        if (userType === 'contractor') {
          console.log('Contractor trying to access customer page, redirecting')
          router.push('/contractor')
          return
        }

        console.log('User authorized as:', userType)

        setUser(user)
        setIsAuthorized(true)
        await fetchQuotes(user.id)
        
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchQuotes = async (customerId: string) => {
    try {
      console.log('=== FETCHING QUOTES ===')
      console.log('Customer ID:', customerId)
      
      const supabase = createBrowserClient()
      
      const { data: quotesData, error: quotesError } = await supabase
        .from('quote_requests')
        .select(`
          *,
          contractor_quotes!contractor_quotes_project_id_fkey (
            id,
            contractor_id,
            project_id,
            price,
            description,
            pdf_url,
            pdf_filename,
            status,
            created_at,
            updated_at,
            contractors!contractor_quotes_contractor_id_fkey (
              id,
              company_name,
              contact_name,
              phone,
              email
            )
          ),
          site_visit_applications!site_visit_applications_project_id_fkey (
            id,
            contractor_id,
            status,
            notes,
            applied_at,
            created_at,
            updated_at,
            contractors!site_visit_applications_contractor_id_fkey (
              id,
              company_name,
              contact_name,
              phone,
              email
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      console.log('Quotes query result:', { quotesData, quotesError })

      if (quotesError) {
        console.error('Error fetching quotes:', quotesError)
        setQuotes([])
        return
      }

      console.log('Successfully fetched quotes:', quotesData?.length || 0)
      setQuotes(quotesData || [])
      setContractorQuotes([])
      // 기본적으로 모든 견적서 섹션을 접혀있게 설정
      if (quotesData && quotesData.length > 0) {
        setCollapsedQuotes(new Set(quotesData.map(q => q.id)))
        setCollapsedSiteVisits(new Set(quotesData.map(q => q.id)))
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setQuotes([])
      setContractorQuotes([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Under Review' }
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
      case 'site-visit-pending':
        return { color: 'bg-emerald-100 text-emerald-800', icon: Calendar, text: 'Site Visit Pending' }
      case 'site-visit-completed':
        return { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: 'Site Visit Completed' }
      case 'bidding':
        return { color: 'bg-orange-100 text-orange-800', icon: Clock, text: 'Bidding' }
      case 'quote-submitted':
        return { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: 'Quote Submitted' }
      case 'contractor-selected':
        return { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, text: 'Contractor Selected' }
      case 'in-progress':
        return { color: 'bg-purple-100 text-purple-800', icon: Play, text: 'In Progress' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' }
      case 'bidding-closed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' }
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Cancelled' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Unknown' }
    }
  }

  const formatBudget = (budget: string) => {
    const budgetMap: { [key: string]: string } = {
      'under_50k': 'Under $50,000',
      '50k_to_100k': '$50,000 - $100,000',
      '50k_100k': '$50,000 - $100,000',
      'over_100k': '$100,000+'
    }
    return budgetMap[budget] || budget
  }

  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': 'Detached House',
    'detached_house': 'Detached House',
    'condo': 'Condo',
    'townhouse': 'Town House',
    'town_house': 'Town House',
    'commercial': 'Commercial',
    'beecroft': 'Beecroft',
    'apartment': 'Apartment',
    'house': 'House'
  }

  const projectTypeMap: { [key: string]: string } = {
    'kitchen': 'Kitchen',
    'bathroom': 'Bathroom',
    'basement': 'Basement',
    'painting': 'Painting',
    'flooring': 'Flooring',
    'full-renovation': 'Full Renovation',
    'full_renovation': 'Full Renovation',
    'restaurant': 'Restaurant',
    'retail': 'Retail',
    'office': 'Office',
    'education': 'Education',
    'other': 'Other'
  }

  const timelineMap: { [key: string]: string } = {
    'asap': 'As soon as possible',
    'immediate': 'Immediate',
    'within_1_month': 'Within 1 month',
    'within_3_months': 'Within 3 months',
    '3_months': 'Within 3 months',
    'flexible': 'Flexible'
  }

  const isInSiteVisitPhase = (status: string) => {
    return ['pending', 'approved', 'site-visit-pending', 'site-visit-completed'].includes(status)
  }

  const handleSelectContractor = async (contractorQuoteId: string, projectId: string, contractorId: string) => {
    if (selectingContractor) {
      console.log('Already processing contractor selection')
      return
    }
    
    try {
      if (!confirm('Do you want to select this contractor? You cannot change this once selected.')) {
        return
      }

      setSelectingContractor(projectId)
      console.log('Selecting contractor:', { contractorQuoteId, projectId, contractorId })

      const selectedQuote = quotes.find(q => q.id === projectId)
      const selectedContractorQuote = selectedQuote?.contractor_quotes?.find(cq => cq.id === contractorQuoteId)
      
      if (selectedQuote && selectedContractorQuote) {
        setQuotes(prevQuotes => prevQuotes.map(quote => {
          if (quote.id === projectId) {
            return {
              ...quote,
              status: 'contractor-selected' as const,
              selected_contractor_id: contractorId,
              contractor_quotes: quote.contractor_quotes?.map(cq => ({
                ...cq,
                status: cq.id === contractorQuoteId ? 'accepted' as const : 'rejected' as const
              }))
            }
          }
          return quote
        }))

        const contractorInfo = selectedContractorQuote.contractors?.company_name || 'Selected Contractor'
        const contactName = selectedContractorQuote.contractors?.contact_name || ''
        const phoneNumber = selectedContractorQuote.contractors?.phone || 'registered phone number'
        
        toast.success(`Contractor selected successfully!\n\n${contractorInfo} ${contactName ? `(${contactName})` : ''} will contact you at ${phoneNumber}.`)
      }

      const response = await fetch('/api/contractor-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorQuoteId, projectId, contractorId })
      })

      const result = await response.json()

      if (!response.ok && !result.message?.includes('이미 업체가 선정된')) {
        console.error('API error:', result)
        if (user?.id) {
          await fetchQuotes(user.id)
        }
        toast.error(result.error || 'Error selecting contractor.')
        return
      }

      console.log('✅ Contractor selection confirmed by server')
      
    } catch (error) {
      console.error('Error selecting contractor:', error)
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      toast.error('업체 선택 중 오류가 발생했습니다.')
    } finally {
      setSelectingContractor(null)
    }
  }

  const handleStartProject = async (projectId: string) => {
    try {
      if (!confirm('Do you want to start the project?\n\nPlease coordinate with the contractor and schedule before clicking this button.')) {
        return
      }

      setStartingProject(projectId)
      console.log('Starting project:', projectId)

      const response = await fetch('/api/start-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('API error:', result)
        toast.error(result.error || 'Error starting project.')
        return
      }

      console.log('API response:', result)
      toast.success('Project started! 🚀')
      
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      
    } catch (error) {
      console.error('Error starting project:', error)
      toast.error('Error starting project.')
    } finally {
      setStartingProject(null)
    }
  }

  const downloadQuote = async (quoteId: string) => {
    if (downloadingQuotes.has(quoteId)) {
      console.log('⚠️ 이미 다운로드 중입니다:', quoteId)
      return
    }

    console.log('🔽 PDF 다운로드 시작, 견적서 ID:', quoteId)
    setDownloadingQuotes(prev => new Set(prev).add(quoteId))
    
    try {
      let quoteData: ContractorQuote | null = null
      
      for (const project of quotes) {
        if (project.contractor_quotes) {
          const found = project.contractor_quotes.find(cq => cq.id === quoteId)
          if (found) {
            quoteData = found
            break
          }
        }
      }

      if (!quoteData) {
        console.error('❌ 견적서 데이터가 존재하지 않습니다')
        toast.error('Quote information not found.')
        return
      }

      if (!quoteData.pdf_url) {
        console.error('❌ PDF URL이 비어있습니다')
        toast.error('Quote file not uploaded.')
        return
      }

      const originalUrl = quoteData.pdf_url
      console.log('📄 원본 URL:', originalUrl)

      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        window.open(originalUrl, '_blank')
        toast.success('견적서를 새 탭에서 엽니다...')
        return
      }

      let filePath = originalUrl.trim()
      const bucketPrefixes = ['contractor-quotes/', '/contractor-quotes/', 'contractor-quotes\\', '\\contractor-quotes\\']
      for (const prefix of bucketPrefixes) {
        if (filePath.startsWith(prefix)) {
          filePath = filePath.substring(prefix.length)
        }
      }

      // 정규식 수정: 슬래시는 이스케이프 불필요
      filePath = filePath.replace(/^\/+|\/+$/g, '')

      const supabase = createBrowserClient()
      const { data: publicUrlData } = supabase.storage
        .from('contractor-quotes')
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        window.open(publicUrlData.publicUrl, '_blank')
        toast.success('견적서를 새 탭에서 엽니다...')
        return
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('contractor-quotes')
        .createSignedUrl(filePath, 3600)

      if (!signedError && signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank')
        toast.success('견적서를 새 탭에서 엽니다...')
        return
      }

      toast.error('Quote file not found.')

    } catch (error: any) {
      console.error('❌ 오류 발생:', error)
      toast.error('Error downloading quote.')
    } finally {
      setDownloadingQuotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(quoteId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in with a customer account.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Page</h1>
          <p className="mt-2 text-gray-600">Compare your quote requests with contractor quotes.</p>
        </div>

        <div className="space-y-6">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quote requests yet</h3>
              <p className="text-gray-600 mb-4">Create a new quote request.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/quote-request')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
                >
                  Request a Quote
                </button>
              </div>
            </div>
          ) : (
            quotes.map((quote) => {
              const statusInfo = getStatusColor(quote.status)
              const IconComponent = statusInfo.icon
              const siteVisitCount = quote.site_visit_applications?.length || 0
              const quoteCount = quote.contractor_quotes?.length || 0
              
              const showSiteVisitInfo = isInSiteVisitPhase(quote.status)
              
              const canStartProject = quote.status === 'contractor-selected' || 
                (quote.status === 'bidding' && quote.selected_contractor_id)
              const isProjectInProgress = quote.status === 'in-progress'
              const isProjectCompleted = quote.status === 'completed'
              
              return (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* 상태 배지 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <IconComponent className="h-4 w-4 mr-2" />
                      {statusInfo.text}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* 프로젝트 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {spaceTypeMap[quote.space_type] || quote.space_type}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {quote.project_types.map(pt => projectTypeMap[pt] || pt).join(', ')}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center mb-1">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatBudget(quote.budget)}
                      </div>
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {timelineMap[quote.timeline] || quote.timeline}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {quote.postal_code}
                      </div>
                    </div>
                  </div>

                  {/* 현장방문 신청 목록 - 새로 추가 */}
                  {siteVisitCount > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <button
                        onClick={() => {
                          setCollapsedSiteVisits(prev => {
                            const newSet = new Set(prev)
                            if (newSet.has(quote.id)) {
                              newSet.delete(quote.id)
                            } else {
                              newSet.add(quote.id)
                            }
                            return newSet
                          })
                        }}
                        className="w-full flex items-center justify-between font-semibold text-gray-900 mb-3 hover:text-emerald-600 transition-colors"
                      >
                        <span>Site Visit Applications ({siteVisitCount})</span>
                        {collapsedSiteVisits.has(quote.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </button>
                      {!collapsedSiteVisits.has(quote.id) && (
                        <div className="space-y-3">
                          {quote.site_visit_applications?.map((app) => (
                            <div key={app.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <Building className="h-5 w-5 text-blue-600 mr-2" />
                                    <p className="font-medium text-gray-900">
                                      {app.contractors?.company_name || 'Company'}
                                    </p>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-2" />
                                      <span>{app.contractors?.contact_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                                    </div>
                                    {app.notes && (
                                      <div className="mt-2 p-2 bg-white rounded border border-blue-100">
                                        <p className="text-xs text-gray-600">{app.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    app.status === 'approved' 
                                      ? 'bg-green-100 text-green-800' 
                                      : app.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 견적서 목록 */}
                  {quoteCount > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <button
                        onClick={() => {
                          setCollapsedQuotes(prev => {
                            const newSet = new Set(prev)
                            if (newSet.has(quote.id)) {
                              newSet.delete(quote.id)
                            } else {
                              newSet.add(quote.id)
                            }
                            return newSet
                          })
                        }}
                        className="w-full flex items-center justify-between font-semibold text-gray-900 mb-3 hover:text-emerald-600 transition-colors"
                      >
                        <span>Contractor Quotes ({quoteCount})</span>
                        {collapsedQuotes.has(quote.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </button>
                      {!collapsedQuotes.has(quote.id) && (
                        <div className="space-y-3">
                          {quote.contractor_quotes?.map((cq) => (
                            <div key={cq.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {cq.contractors?.company_name || 'Company'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    ${cq.price?.toLocaleString() || '0'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {cq.pdf_url && (
                                    <button
                                      onClick={() => downloadQuote(cq.id)}
                                      disabled={downloadingQuotes.has(cq.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm flex items-center disabled:opacity-50"
                                    >
                                      {downloadingQuotes.has(cq.id) ? (
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                      )}
                                      View Quote
                                    </button>
                                  )}
                                  {cq.status === 'submitted' && quote.status === 'bidding' && (
                                    <button
                                      onClick={() => handleSelectContractor(cq.id, quote.id, cq.contractor_id)}
                                      disabled={selectingContractor === quote.id}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                                    >
                                      {selectingContractor === quote.id ? 'Selecting...' : 'Select'}
                                    </button>
                                  )}
                                  {cq.status === 'accepted' && (
                                    <span className="text-green-600 font-medium">Selected</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 프로젝트 시작 버튼 */}
                  {canStartProject && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-base font-medium text-gray-700 mb-3">
                        Please press this button after finalizing the detailed schedule and signing the contract with your professional partner.
                      </p>
                      <button
                        onClick={() => handleStartProject(quote.id)}
                        disabled={startingProject === quote.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50"
                      >
                        {startingProject === quote.id ? (
                          <>
                            <Loader className="h-5 w-5 mr-2 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Project
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
