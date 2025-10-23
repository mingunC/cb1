'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Plus, Edit2, Trash2, Calendar, Gift, Percent, 
  Tag, AlertCircle, CheckCircle, X, Image as ImageIcon 
} from 'lucide-react'

interface Event {
  id: string
  contractor_id?: string
  title: string
  subtitle: string
  description: string
  type: 'discount' | 'gift' | 'special' | 'season' | 'collaboration'
  discount_rate?: number
  original_price?: number
  discounted_price?: number
  image_url: string
  thumbnail_url?: string
  start_date: string
  end_date: string
  is_featured: boolean
  is_active: boolean
  terms_conditions: string[]
  target_space?: string[]
  min_budget?: number
  max_participants?: number
  current_participants?: number
  tags: string[]
  contractor?: {
    company_name: string
  }
  created_at: string
}

interface Contractor {
  id: string
  company_name: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    contractor_id: '',
    title: '',
    subtitle: '',
    description: '',
    type: 'discount' as Event['type'],
    discount_rate: '',
    original_price: '',
    discounted_price: '',
    image_url: '',
    start_date: '',
    end_date: '',
    is_featured: false,
    is_active: true,
    terms_conditions: '',
    target_space: '',
    min_budget: '',
    max_participants: '',
    tags: ''
  })

  useEffect(() => {
    fetchEvents()
    fetchContractors()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      showNotification('error', '이벤트 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContractors = async () => {
    try {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from('contractors')
        .select('id, company_name')
        .order('company_name')
      
      setContractors(data || [])
    } catch (error) {
      console.error('Error fetching contractors:', error)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 데이터 변환
      const eventData = {
        ...formData,
        discount_rate: formData.discount_rate ? parseInt(formData.discount_rate) : null,
        original_price: formData.original_price ? parseInt(formData.original_price) : null,
        discounted_price: formData.discounted_price ? parseInt(formData.discounted_price) : null,
        min_budget: formData.min_budget ? parseInt(formData.min_budget) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        terms_conditions: formData.terms_conditions 
          ? formData.terms_conditions.split('\n').filter(t => t.trim()) 
          : [],
        target_space: formData.target_space 
          ? formData.target_space.split(',').map(s => s.trim()).filter(s => s) 
          : [],
        tags: formData.tags 
          ? formData.tags.split(',').map(t => t.trim()).filter(t => t) 
          : []
      }

      if (editingEvent) {
        // 수정
        const response = await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEvent.id, ...eventData })
        })

        if (!response.ok) throw new Error('Failed to update event')
        showNotification('success', '이벤트가 수정되었습니다.')
      } else {
        // 생성
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })

        if (!response.ok) throw new Error('Failed to create event')
        showNotification('success', '이벤트가 생성되었습니다.')
      }

      fetchEvents()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving event:', error)
      showNotification('error', '이벤트 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 이벤트를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/events?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete event')
      
      showNotification('success', '이벤트가 삭제되었습니다.')
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      showNotification('error', '이벤트 삭제에 실패했습니다.')
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      contractor_id: event.contractor_id || '',
      title: event.title,
      subtitle: event.subtitle || '',
      description: event.description,
      type: event.type,
      discount_rate: event.discount_rate?.toString() || '',
      original_price: event.original_price?.toString() || '',
      discounted_price: event.discounted_price?.toString() || '',
      image_url: event.image_url,
      start_date: event.start_date,
      end_date: event.end_date,
      is_featured: event.is_featured,
      is_active: event.is_active,
      terms_conditions: event.terms_conditions.join('\n'),
      target_space: event.target_space?.join(', ') || '',
      min_budget: event.min_budget?.toString() || '',
      max_participants: event.max_participants?.toString() || '',
      tags: event.tags.join(', ')
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEvent(null)
    setFormData({
      contractor_id: '',
      title: '',
      subtitle: '',
      description: '',
      type: 'discount',
      discount_rate: '',
      original_price: '',
      discounted_price: '',
      image_url: '',
      start_date: '',
      end_date: '',
      is_featured: false,
      is_active: true,
      terms_conditions: '',
      target_space: '',
      min_budget: '',
      max_participants: '',
      tags: ''
    })
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'discount': '할인',
      'gift': '증정',
      'special': '특별',
      'season': '시즌',
      'collaboration': '제휴'
    }
    return labels[type] || type
  }

  const getStatusLabel = (event: Event) => {
    const now = new Date()
    const start = new Date(event.start_date)
    const end = new Date(event.end_date)

    if (!event.is_active) return { label: '비활성', color: 'bg-gray-500' }
    if (start > now) return { label: '예정', color: 'bg-blue-500' }
    if (end < now) return { label: '종료', color: 'bg-gray-500' }
    return { label: '진행중', color: 'bg-green-500' }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 알림 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {notification.message}
        </div>
      )}

      {/* 헤더 */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
            <p className="text-gray-600 mt-1">이벤트 및 프로모션을 관리합니다</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus className="h-5 w-5" />
            이벤트 추가
          </button>
        </div>

        {/* 이벤트 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">로딩 중...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">등록된 이벤트가 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map(event => {
                  const status = getStatusLabel(event)
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="h-12 w-12 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{event.title}</div>
                            <div className="text-sm text-gray-500">{event.subtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.contractor?.company_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {getEventTypeLabel(event.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(event.start_date).toLocaleDateString()} ~<br/>
                        {new Date(event.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${status.color}`}>
                          {status.label}
                        </span>
                        {event.is_featured && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            특별
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingEvent ? '이벤트 수정' : '새 이벤트 추가'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 업체 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업체 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.contractor_id}
                  onChange={(e) => setFormData({ ...formData, contractor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">업체 선택 (선택사항)</option>
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부제목
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이벤트 타입 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Event['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="discount">할인</option>
                    <option value="gift">증정</option>
                    <option value="special">특별</option>
                    <option value="season">시즌</option>
                    <option value="collaboration">제휴</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    할인율 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_rate}
                    onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정상가
                  </label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    할인가
                  </label>
                  <input
                    type="number"
                    value={formData.discounted_price}
                    onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* 기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 예산
                  </label>
                  <input
                    type="number"
                    value={formData.min_budget}
                    onChange={(e) => setFormData({ ...formData, min_budget: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 참여자 수
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 대상 공간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대상 공간 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.target_space}
                  onChange={(e) => setFormData({ ...formData, target_space: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="주방, 거실, 침실"
                />
              </div>

              {/* 이용 조건 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이용 조건 (한 줄에 하나씩)
                </label>
                <textarea
                  rows={4}
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="3천만원 이상 시공 시 적용&#10;타 할인 이벤트와 중복 불가"
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="신년이벤트, 할인, 특가"
                />
              </div>

              {/* 상태 */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">특별 이벤트</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">활성화</span>
                </label>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {editingEvent ? '수정하기' : '추가하기'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
