'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ImageIcon,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface ContractorProfile {
  id: string
  user_id: string
  company_name: string
  phone: string
  email: string
  description: string
  service_areas: string[]
}

export default function ContractorProfilePage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [profile, setProfile] = useState<ContractorProfile>({
    id: '',
    user_id: '',
    company_name: '',
    phone: '',
    email: '',
    description: '',
    service_areas: []
  })

  // 서비스 지역 옵션
  const serviceAreaOptions = [
    '서울 전체',
    '서울 강남/서초',
    '서울 강동/송파',
    '서울 강서/양천',
    '서울 강북/도봉',
    '서울 중구/용산',
    '서울 동대문/성동',
    '경기 북부',
    '경기 남부',
    '경기 동부',
    '경기 서부',
    '인천',
    '부산',
    '대구',
    '광주',
    '대전',
    '울산',
    '제주'
  ]

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      setIsLoading(true)
      
      // 현재 로그인한 사용자 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        // 로그인되지 않은 경우 로그인 페이지로 이동
        router.push('/contractor-login')
        return
      }

      // contractors 테이블에서 프로필 조회
      const { data: contractorData, error: fetchError } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // 프로필이 없는 경우 새로 생성
        if (fetchError.code === 'PGRST116') {
          const newProfile = {
            user_id: user.id,
            company_name: '',
            phone: '',
            email: user.email || '',
            description: '',
            service_areas: [],
            status: 'active'
          }
          
          const { data: insertedData, error: insertError } = await supabase
            .from('contractors')
            .insert([newProfile])
            .select()
            .single()

          if (insertError) {
            console.error('프로필 생성 실패:', insertError)
            setErrorMessage('프로필 생성에 실패했습니다.')
          } else {
            setProfile(insertedData)
          }
        } else {
          console.error('프로필 조회 실패:', fetchError)
          setErrorMessage('프로필을 불러오는데 실패했습니다.')
        }
      } else {
        setProfile(contractorData)
      }
    } catch (error) {
      console.error('오류 발생:', error)
      setErrorMessage('오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ContractorProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceAreaToggle = (area: string) => {
    setProfile(prev => ({
      ...prev,
      service_areas: prev.service_areas.includes(area)
        ? prev.service_areas.filter(a => a !== area)
        : [...prev.service_areas, area]
    }))
  }

  const handleSave = async () => {
    // 유효성 검증
    if (!profile.company_name.trim()) {
      setErrorMessage('업체명을 입력해주세요.')
      setSaveStatus('error')
      return
    }
    
    if (!profile.phone.trim()) {
      setErrorMessage('연락처를 입력해주세요.')
      setSaveStatus('error')
      return
    }
    
    if (!profile.email.trim()) {
      setErrorMessage('이메일을 입력해주세요.')
      setSaveStatus('error')
      return
    }
    
    if (profile.service_areas.length === 0) {
      setErrorMessage('서비스 지역을 최소 1개 이상 선택해주세요.')
      setSaveStatus('error')
      return
    }

    try {
      setIsSaving(true)
      setSaveStatus('idle')
      setErrorMessage('')

      const { error } = await supabase
        .from('contractors')
        .update({
          company_name: profile.company_name,
          phone: profile.phone,
          email: profile.email,
          description: profile.description,
          service_areas: profile.service_areas,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) {
        console.error('저장 실패:', error)
        setErrorMessage('저장에 실패했습니다.')
        setSaveStatus('error')
      } else {
        setSaveStatus('success')
        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      }
    } catch (error) {
      console.error('오류 발생:', error)
      setErrorMessage('오류가 발생했습니다.')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/contractor"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">업체 프로필 관리</h1>
            </div>
            <Link
              href="/pros"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              프로필 보기
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">간편한 프로필 관리</p>
                <p>고객에게 보여질 기본 정보를 입력해주세요. 포트폴리오는 헤더의 포트폴리오 메뉴에서 별도로 관리할 수 있습니다.</p>
              </div>
            </div>
          </div>

          {/* 입력 폼 */}
          <div className="space-y-6">
            {/* 업체명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="예: 우리집 리모델링"
              />
            </div>

            {/* 연락처 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="예: 02-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="예: contact@company.com"
                />
              </div>
            </div>

            {/* 업체 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업체 설명
              </label>
              <textarea
                value={profile.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="우리 업체의 강점과 특징을 소개해주세요. 고객에게 신뢰를 줄 수 있는 내용을 작성해보세요."
              />
              <p className="text-sm text-gray-500 mt-1">
                {profile.description.length}/500
              </p>
            </div>

            {/* 서비스 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                서비스 지역 <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-2">(최소 1개 이상 선택)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {serviceAreaOptions.map(area => (
                  <label
                    key={area}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                      profile.service_areas.includes(area)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.service_areas.includes(area)}
                      onChange={() => handleServiceAreaToggle(area)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 포트폴리오 안내 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-gray-600" />
                    포트폴리오 관리
                  </h3>
                  <p className="text-sm text-gray-600">
                    시공 사례와 포트폴리오는 별도 페이지에서 관리할 수 있습니다.
                  </p>
                </div>
                <Link
                  href="/portfolio"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  포트폴리오 관리
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 상담 버튼 안내 */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex">
                <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">상담하기 버튼</p>
                  <p>프로필 페이지에 자동으로 상담하기 버튼이 표시됩니다. 고객이 버튼을 클릭하면 입력하신 연락처로 연결됩니다.</p>
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {errorMessage && saveStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* 성공 메시지 */}
            {saveStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-green-800">프로필이 성공적으로 저장되었습니다!</p>
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link
                href="/contractor"
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">도움말</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>프로필 정보는 고객이 업체를 선택하는 중요한 기준이 됩니다. 정확한 정보를 입력해주세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>서비스 지역은 실제로 시공이 가능한 지역만 선택해주세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>업체 설명은 500자 이내로 작성 가능하며, 핵심 강점을 간결하게 표현하는 것이 좋습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>프로필은 언제든지 수정할 수 있으며, 저장 즉시 고객에게 반영됩니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}