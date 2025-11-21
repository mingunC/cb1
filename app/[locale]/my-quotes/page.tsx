'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase/clients'
import { getQuoteRequests } from '@/lib/supabase/quotes'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Download, FileText, Building, User, Home, Play, Loader, ChevronDown, ChevronUp, Edit, X } from 'lucide-react'
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
  phone: string
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
  const t = useTranslations()
  const params = useParams()
  const locale = params.locale as string
  
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
  const [editingQuote, setEditingQuote] = useState<QuoteRequest | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push(`/${locale}/login`)
          return
        }

        if (process.env.NODE_ENV === 'development') console.log('Checking user type for user ID:', user.id, 'Email:', user.email)
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_type, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()

        if (process.env.NODE_ENV === 'development') console.log('User type check result:', { userData, userError })

        let userType = 'customer'
        if (userData && userData.user_type) {
          userType = userData.user_type
        } else if (userError && userError.code === 'PGRST116') {
          if (process.env.NODE_ENV === 'development') console.log('User not found in users table, treating as customer')
          userType = 'customer'
        } else if (userError) {
          if (process.env.NODE_ENV === 'development') console.log('Error checking user type:', userError)
          userType = 'customer'
        }

        if (userType === 'contractor') {
          if (process.env.NODE_ENV === 'development') console.log('Contractor trying to access customer page, redirecting')
          router.push(`/${locale}/contractor`)
          return
        }

        if (process.env.NODE_ENV === 'development') console.log('User authorized as:', userType)

        setUser(user)
        setIsAuthorized(true)
        await fetchQuotes(user.id)
        
      } catch (error) {
        console.error('Auth check error:', error)
        router.push(`/${locale}/login`)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, locale])

  const fetchQuotes = async (customerId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('=== FETCHING QUOTES ===')
      if (process.env.NODE_ENV === 'development') console.log('Customer ID:', customerId)
      
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
      
      if (process.env.NODE_ENV === 'development') console.log('Quotes query result:', { quotesData, quotesError })

      if (quotesError) {
        console.error('Error fetching quotes:', quotesError)
        setQuotes([])
        return
      }

      if (process.env.NODE_ENV === 'development') console.log('Successfully fetched quotes:', quotesData?.length || 0)
      setQuotes(quotesData || [])
      setContractorQuotes([])
      // Collapse all quote sections by default
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

  const handleUpdateQuote = async () => {
    if (!editingQuote) return
    
    setIsUpdating(true)
    try {
      const supabase = createBrowserClient()
      
      const updateData = {
        space_type: editingQuote.space_type,
        project_types: editingQuote.project_types,
        budget: editingQuote.budget,
        timeline: editingQuote.timeline,
        postal_code: editingQuote.postal_code,
        full_address: editingQuote.full_address,
        visit_date: editingQuote.visit_date || null,
        description: editingQuote.description,
        phone: editingQuote.phone,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('quote_requests')
        .update(updateData)
        .eq('id', editingQuote.id)
        .select()
        .single()
      
      if (error) {
        console.error('Update error:', error)
        toast.error('Failed to update quote request')
        return
      }
      
      toast.success('Quote request updated successfully!')
      setEditingQuote(null)
      
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      
    } catch (error) {
      console.error('Error updating quote:', error)
      toast.error('Error updating quote request')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatPostalCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 10)
    
    if (limited.length === 0) {
      return ''
    } else if (limited.length <= 3) {
      return `(${limited})`
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: { color: string, icon: any, key: string } } = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, key: 'pending' },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle, key: 'approved' },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle, key: 'rejected' },
      'site-visit-pending': { color: 'bg-emerald-100 text-emerald-800', icon: Calendar, key: 'siteVisitPending' },
      'site-visit-completed': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, key: 'siteVisitCompleted' },
      'bidding': { color: 'bg-orange-100 text-orange-800', icon: Clock, key: 'bidding' },
      'quote-submitted': { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, key: 'quoteSubmitted' },
      'contractor-selected': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, key: 'contractorSelected' },
      'in-progress': { color: 'bg-purple-100 text-purple-800', icon: Play, key: 'inProgress' },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, key: 'completed' },
      'bidding-closed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, key: 'biddingClosed' },
      'cancelled': { color: 'bg-gray-100 text-gray-800', icon: XCircle, key: 'cancelled' }
    }

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, key: 'unknown' }
    return { 
      color: statusInfo.color, 
      icon: statusInfo.icon, 
      text: t(`status.${statusInfo.key}`)
    }
  }

  const formatBudget = (budget: string) => {
    const budgetKeyMap: { [key: string]: string } = {
      'under_50k': 'under50k',
      '50k_to_100k': '50kTo100k',
      '50k_100k': '50kTo100k',
      'over_100k': 'over100k'
    }
    const key = budgetKeyMap[budget]
    return key ? t(`budget.${key}`) : budget
  }

  const getSpaceTypeName = (spaceType: string) => {
    const normalizedType = spaceType.replace(/-/g, '_').replace(/_/g, '')
    const keyMap: { [key: string]: string } = {
      'detachedhouse': 'detachedHouse',
      'detached_house': 'detachedHouse',
      'condo': 'condo',
      'townhouse': 'townhouse',
      'town_house': 'townhouse',
      'commercial': 'commercial',
      'beecroft': 'beecroft',
      'apartment': 'apartment',
      'house': 'house'
    }
    const key = keyMap[normalizedType] || normalizedType
    return t(`spaceTypes.${key}`, { default: spaceType })
  }

  const getProjectTypeName = (projectType: string) => {
    const normalizedType = projectType.replace(/-/g, '').replace(/_/g, '')
    const keyMap: { [key: string]: string } = {
      'kitchen': 'kitchen',
      'bathroom': 'bathroom',
      'basement': 'basement',
      'painting': 'painting',
      'flooring': 'flooring',
      'fullrenovation': 'fullRenovation',
      'full_renovation': 'fullRenovation',
      'restaurant': 'restaurant',
      'retail': 'retail',
      'office': 'office',
      'education': 'education',
      'other': 'other'
    }
    const key = keyMap[normalizedType] || normalizedType
    return t(`projectTypes.${key}`, { default: projectType })
  }

  const getTimelineName = (timeline: string) => {
    const keyMap: { [key: string]: string } = {
      'asap': 'asap',
      'immediate': 'immediate',
      '1_month': '1month',
      'within_1_month': 'within1Month',
      'within_3_months': 'within3Months',
      '3_months': '3months',
      'flexible': 'flexible'
    }
    const key = keyMap[timeline]
    return key ? t(`timeline.${key}`) : timeline
  }

  const isInSiteVisitPhase = (status: string) => {
    return ['pending', 'approved', 'site-visit-pending', 'site-visit-completed'].includes(status)
  }

  const handleSelectContractor = async (contractorQuoteId: string, projectId: string, contractorId: string) => {
    if (selectingContractor) {
      if (process.env.NODE_ENV === 'development') console.log('Already processing contractor selection')
      return
    }
    
    try {
      if (!confirm('Do you want to select this contractor? You cannot change this once selected.')) {
        return
      }

      setSelectingContractor(projectId)
      if (process.env.NODE_ENV === 'development') console.log('Selecting contractor:', { contractorQuoteId, projectId, contractorId })

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

      if (!response.ok && !result.message?.includes('contractor already selected')) {
        console.error('API error:', result)
        if (user?.id) {
          await fetchQuotes(user.id)
        }
        toast.error(result.error || 'Error selecting contractor.')
        return
      }

      if (process.env.NODE_ENV === 'development') console.log('✅ Contractor selection confirmed by server')
      
    } catch (error) {
      console.error('Error selecting contractor:', error)
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      toast.error('Error selecting contractor.')
    } finally {
      setSelectingContractor(null)
    }
  }

  const handleStartProject = async (projectId: string) => {
    if (startingProject) {
      if (process.env.NODE_ENV === 'development') console.log('Already starting a project')
      return
    }

    try {
      if (!confirm('Do you want to start the project?\n\nPlease coordinate with the contractor and schedule before clicking this button.')) {
        return
      }

      setStartingProject(projectId)
      if (process.env.NODE_ENV === 'development') console.log('Starting project:', projectId)

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

      if (process.env.NODE_ENV === 'development') console.log('API response:', result)
      toast.success('Project started! 🚀')
      
    } catch (error) {
      console.error('Error starting project:', error)
      toast.error('Error starting project.')
    } finally {
      setStartingProject(null)
      
      if (user?.id) {
        await fetchQuotes(user.id)
      }
    }
  }

  const downloadQuote = async (quoteId: string) => {
    if (downloadingQuotes.has(quoteId)) {
      if (process.env.NODE_ENV === 'development') console.log('⚠️ Already downloading:', quoteId)
      return
    }

    if (process.env.NODE_ENV === 'development') console.log('🔽 Starting PDF download, quote ID:', quoteId)
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
        console.error('❌ Quote data does not exist')
        toast.error('Quote information not found.')
        return
      }

      if (!quoteData.pdf_url) {
        console.error('❌ PDF URL is empty')
        toast.error('Quote file not uploaded.')
        return
      }

      const originalUrl = quoteData.pdf_url
      if (process.env.NODE_ENV === 'development') console.log('📄 Original URL:', originalUrl)

      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        window.open(originalUrl, '_blank')
        toast.success('Opening quote in new tab...')
        return
      }

      let filePath = originalUrl.trim()
      const bucketPrefixes = ['contractor-quotes/', '/contractor-quotes/', 'contractor-quotes\\', '\\contractor-quotes\\']
      for (const prefix of bucketPrefixes) {
        if (filePath.startsWith(prefix)) {
          filePath = filePath.substring(prefix.length)
        }
      }

      filePath = filePath.replace(/^\/+|\/+$/g, '')

      const supabase = createBrowserClient()
      const { data: publicUrlData } = supabase.storage
        .from('contractor-quotes')
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        window.open(publicUrlData.publicUrl, '_blank')
        toast.success('Opening quote in new tab...')
        return
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('contractor-quotes')
        .createSignedUrl(filePath, 3600)

      if (!signedError && signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank')
        toast.success('Opening quote in new tab...')
        return
      }

      toast.error('Quote file not found.')

    } catch (error: any) {
      console.error('❌ Error occurred:', error)
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
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('myPage.accessDenied')}</h1>
          <p className="text-gray-600 mb-4">{t('myPage.loginRequired')}</p>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
          >
            {t('myPage.goToLogin')}
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
            {t('common.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('myPage.title')}</h1>
          <p className="mt-2 text-gray-600">{t('myPage.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myPage.noQuotes')}</h3>
              <p className="text-gray-600 mb-4">{t('myPage.createNew')}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push(`/${locale}/quote-request`)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
                >
                  {t('myPage.requestQuote')}
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
              
              const canEdit = quote.status === 'pending'
              
              return (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Status badge and Edit button */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <IconComponent className="h-4 w-4 mr-2" />
                      {statusInfo.text}
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => setEditingQuote(quote)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          <Edit className="h-4 w-4" />
                          {t('common.edit')}
                        </button>
                      )}
                      <div className="text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Project information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {getSpaceTypeName(quote.space_type)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {quote.project_types.map(pt => getProjectTypeName(pt)).join(', ')}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center mb-1">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatBudget(quote.budget)}
                      </div>
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {getTimelineName(quote.timeline)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {quote.postal_code}
                      </div>
                    </div>
                  </div>

                  {/* Site visit applications list */}
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
                        <span>{t('myPage.siteVisitApplications')} ({siteVisitCount})</span>
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
                                      {app.contractors?.company_name || t('myPage.company')}
                                    </p>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-2" />
                                      <span>{app.contractors?.contact_name || t('myPage.notAvailable')}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      <span>{t('myPage.applied')}: {new Date(app.applied_at).toLocaleDateString()}</span>
                                    </div>
                                    {app.notes && (
                                      <div className="mt-2 p-2 bg-white rounded border border-blue-100">
                                        <p className="text-xs text-gray-600">{app.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {app.status !== 'pending' && (
                                  <div className="ml-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      app.status === 'approved' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contractor quotes list */}
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
                        <span>{t('myPage.contractorQuotes')} ({quoteCount})</span>
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
                                    {cq.contractors?.company_name || t('myPage.company')}
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
                                      {t('myPage.viewQuote')}
                                    </button>
                                  )}
                                  {cq.status === 'submitted' && quote.status === 'bidding' && (
                                    <button
                                      onClick={() => handleSelectContractor(cq.id, quote.id, cq.contractor_id)}
                                      disabled={selectingContractor === quote.id}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                                    >
                                      {selectingContractor === quote.id ? t('common.selecting') : t('common.select')}
                                    </button>
                                  )}
                                  {cq.status === 'accepted' && (
                                    <span className="text-green-600 font-medium">{t('common.selected')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Start project button */}
                  {canStartProject && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-base font-medium text-gray-700 mb-3">
                        {t('myPage.pleasePress')}
                      </p>
                      <button
                        onClick={() => handleStartProject(quote.id)}
                        disabled={startingProject === quote.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50"
                      >
                        {startingProject === quote.id ? (
                          <>
                            <Loader className="h-5 w-5 mr-2 animate-spin" />
                            {t('myPage.starting')}
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            {t('myPage.startProject')}
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

      {/* Edit Modal */}
      {editingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('myPage.editQuoteRequest')}</h2>
                <button
                  onClick={() => setEditingQuote(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quote.projectDescription')}</label>
                  <textarea
                    value={editingQuote.description}
                    onChange={(e) => setEditingQuote({ ...editingQuote, description: e.target.value })}
                    rows={6}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={t('quote.descriptionPlaceholder')}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quote.phoneNumber')}</label>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={editingQuote.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setEditingQuote({ ...editingQuote, phone: formatted })
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={t('quote.phonePlaceholder')}
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quote.postalCode')}</label>
                  <input
                    type="text"
                    value={editingQuote.postal_code}
                    onChange={(e) => {
                      const formatted = formatPostalCode(e.target.value)
                      setEditingQuote({ ...editingQuote, postal_code: formatted })
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={t('quote.postalCodePlaceholder')}
                    maxLength={7}
                  />
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quote.fullAddress')}</label>
                  <input
                    type="text"
                    value={editingQuote.full_address}
                    onChange={(e) => setEditingQuote({ ...editingQuote, full_address: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={t('quote.addressPlaceholder')}
                  />
                </div>

                {/* Visit Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('quote.preferredVisitDate')}</label>
                  <input
                    type="date"
                    value={editingQuote.visit_date || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, visit_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleUpdateQuote}
                    disabled={isUpdating}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? t('common.updating') : t('common.update')}
                  </button>
                  <button
                    onClick={() => setEditingQuote(null)}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
