'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, DollarSign, Check, X, Plus, Calendar, AlertCircle, Search } from 'lucide-react'

interface CommissionRecord {
  id: string
  quote_request_id: string
  contractor_id: string
  contractor_name: string
  project_title: string
  quote_amount: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'received'
  started_at: string | null
  marked_manually: boolean
  payment_received_at: string | null
  notes: string | null
  created_at: string
}

interface Project {
  id: string
  title: string
  status: string
  created_at: string
}

interface ContractorQuote {
  id: string
  contractor_id: string
  contractor_name: string
  amount: number
}

export default function CommissionManagementPage() {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'received'>('all')
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  
  // 수동 등록 관련 상태
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [contractorQuotes, setContractorQuotes] = useState<ContractorQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadCommissions()
  }, [filter])

  const checkAuthAndLoadCommissions = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || session.user.email !== 'cmgg919@gmail.com') {
        router.push('/admin')
        return
      }

      await loadCommissions()
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/admin')
    }
  }

  const loadCommissions = async () => {
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()

      let query = supabase
        .from('commission_tracking')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setCommissions(data || [])
    } catch (error) {
      console.error('Error loading commissions:', error)
      alert('수수료 내역을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableProjects = async () => {
    try {
      const supabase = createBrowserClient()
      
      // 이미 수수료 추적이 있는 프로젝트 ID 가져오기
      const { data: existingCommissions } = await supabase
        .from('commission_tracking')
        .select('quote_request_id')
      
      const existingProjectIds = existingCommissions?.map(c => c.quote_request_id) || []
      
      // 수수료 추적이 없고, 선택된 견적이 있는 프로젝트 가져오기
      let query = supabase
        .from('quote_requests')
        .select('id, title, status, created_at, selected_contractor_quote_id')
        .not('selected_contractor_quote_id', 'is', null)
        .order('created_at', { ascending: false })
      
      if (existingProjectIds.length > 0) {
        query = query.not('id', 'in', `(${existingProjectIds.join(',')})`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setAvailableProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      alert('프로젝트 목록을 불러오는데 실패했습니다.')
    }
  }

  const loadContractorQuotes = async (projectId: string) => {
    try {
      const supabase = createBrowserClient()
      
      const { data, error } = await supabase
        .from('contractor_quotes')
        .select(`
          id,
          amount,
          contractor_id,
          contractors (
            company_name
          )
        `)
        .eq('quote_request_id', projectId)
      
      if (error) throw error
      
      const quotes = data?.map(q => ({
        id: q.id,
        contractor_id: q.contractor_id,
        contractor_name: (q.contractors as any)?.company_name || '업체명 없음',
        amount: q.amount
      })) || []
      
      setContractorQuotes(quotes)
    } catch (error) {
      console.error('Error loading quotes:', error)
      alert('견적 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProject(projectId)
    setSelectedQuote('')
    if (projectId) {
      await loadContractorQuotes(projectId)
    } else {
      setContractorQuotes([])
    }
  }

  const handleManualSubmit = async () => {
    if (!selectedProject || !selectedQuote || !startDate) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      const supabase = createBrowserClient()
      
      // 선택된 프로젝트 정보 가져오기
      const { data: project } = await supabase
        .from('quote_requests')
        .select('title')
        .eq('id', selectedProject)
        .single()
      
      // 선택된 견적 정보 가져오기
      const selectedQuoteData = contractorQuotes.find(q => q.id === selectedQuote)
      
      if (!project || !selectedQuoteData) {
        throw new Error('프로젝트 또는 견적 정보를 찾을 수 없습니다.')
      }
      
      const commissionAmount = selectedQuoteData.amount * 0.10
      
      // 수수료 추적 생성
      const { error } = await supabase
        .from('commission_tracking')
        .insert({
          quote_request_id: selectedProject,
          contractor_id: selectedQuoteData.contractor_id,
          contractor_name: selectedQuoteData.contractor_name,
          project_title: project.title,
          quote_amount: selectedQuoteData.amount,
          commission_rate: 10.00,
          commission_amount: commissionAmount,
          status: 'pending',
          started_at: new Date(startDate).toISOString(),
          marked_manually: true
        })
      
      if (error) throw error
      
      alert('수수료가 성공적으로 등록되었습니다.')
      setIsAddingManual(false)
      setSelectedProject('')
      setSelectedQuote('')
      setStartDate('')
      setContractorQuotes([])
      loadCommissions()
    } catch (error) {
      console.error('Error creating manual commission:', error)
      alert('수수료 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const markAsReceived = async (commissionId: string) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('commission_tracking')
        .update({
          status: 'received',
          payment_received_at: new Date().toISOString()
        })
        .eq('id', commissionId)

      if (error) throw error

      alert('수수료 수령 완료로 표시되었습니다.')
      loadCommissions()
    } catch (error) {
      console.error('Error marking as received:', error)
      alert('수수료 상태 업데이트에 실패했습니다.')
    }
  }

  const markAsPending = async (commissionId: string) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('commission_tracking')
        .update({
          status: 'pending',
          payment_received_at: null
        })
        .eq('id', commissionId)

      if (error) throw error

      alert('수수료 미수령으로 표시되었습니다.')
      loadCommissions()
    } catch (error) {
      console.error('Error marking as pending:', error)
      alert('수수료 상태 업데이트에 실패했습니다.')
    }
  }

  const saveNote = async (commissionId: string) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('commission_tracking')
        .update({ notes: noteText })
        .eq('id', commissionId)

      if (error) throw error

      setEditingNote(null)
      setNoteText('')
      loadCommissions()
    } catch (error) {
      console.error('Error saving note:', error)
      alert('메모 저장에 실패했습니다.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0)

  const totalReceived = commissions
    .filter(c => c.status === 'received')
    .reduce((sum, c) => sum + c.commission_amount, 0)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                대시보드로
              </button>
              <h1 className="text-xl font-bold text-gray-900">수수료 관리</h1>
            </div>
            <button
              onClick={() => {
                setIsAddingManual(true)
                loadAvailableProjects()
              }}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              수동 등록
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">미수령 수수료</p>
                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {commissions.filter(c => c.status === 'pending').length}건
                </p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">수령 완료</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {commissions.filter(c => c.status === 'received').length}건
                </p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">전체 수수료</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(totalPending + totalReceived)}
                </p>
                <p className="text-sm text-gray-500 mt-1">{commissions.length}건</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              전체 ({commissions.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                filter === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              미수령 ({commissions.filter(c => c.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('received')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                filter === 'received'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              수령완료 ({commissions.filter(c => c.status === 'received').length})
            </button>
          </div>
        </div>

        {/* 수수료 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업체명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    견적금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수수료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시작일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메모
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      수수료 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {commission.contractor_name}
                        </div>
                        {commission.marked_manually && (
                          <span className="text-xs text-orange-600">(수동 등록)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{commission.project_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(commission.quote_amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {commission.commission_rate}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600">
                          {formatCurrency(commission.commission_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(commission.started_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {commission.status === 'pending' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            미수령
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            수령완료
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingNote === commission.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                              placeholder="메모 입력"
                            />
                            <button
                              onClick={() => saveNote(commission.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingNote(null)
                                setNoteText('')
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNote(commission.id)
                              setNoteText(commission.notes || '')
                            }}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            {commission.notes || '메모 추가'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {commission.status === 'pending' ? (
                          <button
                            onClick={() => markAsReceived(commission.id)}
                            className="flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            수령완료
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsPending(commission.id)}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-700 font-medium"
                          >
                            <X className="h-4 w-4 mr-1" />
                            취소
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 수동 등록 모달 */}
      {isAddingManual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">수수료 수동 등록</h2>
                <button
                  onClick={() => {
                    setIsAddingManual(false)
                    setSelectedProject('')
                    setSelectedQuote('')
                    setStartDate('')
                    setContractorQuotes([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 프로젝트 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 선택 *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">프로젝트를 선택하세요</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} ({project.status})
                    </option>
                  ))}
                </select>
                {availableProjects.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    등록 가능한 프로젝트가 없습니다.
                  </p>
                )}
              </div>

              {/* 업체 견적 선택 */}
              {contractorQuotes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업체 견적 선택 *
                  </label>
                  <div className="space-y-2">
                    {contractorQuotes.map((quote) => (
                      <label
                        key={quote.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedQuote === quote.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="quote"
                            value={quote.id}
                            checked={selectedQuote === quote.id}
                            onChange={(e) => setSelectedQuote(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {quote.contractor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              견적금액: {formatCurrency(quote.amount)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-600">
                            수수료: {formatCurrency(quote.amount * 0.10)}
                          </div>
                          <div className="text-xs text-gray-500">10%</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 시작일 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 시작일 *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">수동 등록 안내</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>고객이 프로젝트 시작 버튼을 누르지 않은 경우에만 사용하세요</li>
                      <li>업체로부터 프로젝트 시작 확인을 받은 후 등록하세요</li>
                      <li>수동 등록된 항목은 "(수동 등록)" 표시가 됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsAddingManual(false)
                  setSelectedProject('')
                  setSelectedQuote('')
                  setStartDate('')
                  setContractorQuotes([])
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!selectedProject || !selectedQuote || !startDate || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
