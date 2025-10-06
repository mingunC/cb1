'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Camera, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ContractorProfile {
  id: string
  company_name: string
  company_logo?: string
  description?: string
  phone?: string
  email?: string
  address?: string
  website?: string
  specialties?: string[]
  years_in_business?: number
  license_number?: string
  insurance?: string
}

// 허용 가능한 파일 확장명 정의
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function ContractorProfile() {
  const router = useRouter()
  const [profile, setProfile] = useState<ContractorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    specialties: [] as string[],
    years_in_business: 0,
    license_number: '',
    insurance: ''
  })

  useEffect(() => {
    loadProfile()
  }, []) // 의존성 배열 비워두기 - 마운트 시 한 번만 실행

  const loadProfile = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/contractor-login')
        return
      }

      const { data: contractor, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error('프로필 로드 에러:', error)
        throw error
      }

      if (contractor) {
        setProfile(contractor)
        setFormData({
          company_name: contractor.company_name || '',
          description: contractor.description || '',
          phone: contractor.phone || '',
          email: contractor.email || session.user.email || '',
          address: contractor.address || '',
          website: contractor.website || '',
          specialties: contractor.specialties || [],
          years_in_business: contractor.years_in_business || 0,
          license_number: contractor.license_number || '',
          insurance: contractor.insurance || ''
        })
        
        // 로고 URL이 있으면 미리보기 설정
        if (contractor.company_logo) {
          console.log('✅ 로고 URL 로드:', contractor.company_logo)
          setLogoPreview(contractor.company_logo)
        }
      }
    } catch (error: any) {
      console.error('프로필 로드 실패:', error)
      if (error.code === '42703') {
        toast.error('데이터베이스 설정 오류: add-profile-columns.sql을 실행하세요.')
      } else {
        toast.error('프로필을 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 input 값 초기화 (같은 파일 재선택 가능하게)
    event.target.value = ''

    // 파일 확장명 검증
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      toast.error(`허용되지 않는 파일 형식입니다. 지원 형식: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`)
      return
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`파일 크기는 ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB 이하여야 합니다`)
      return
    }

    if (!profile) {
      toast.error('프로필 정보를 불러올 수 없습니다')
      return
    }

    setIsUploadingLogo(true)
    console.log('📤 로고 업로드 시작...')
    
    try {
      const supabase = createBrowserClient()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `contractor-logos/${fileName}`

      // 1. 파일 업로드
      console.log('1️⃣ 파일 업로드 중:', filePath)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('portfolios')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ 업로드 실패:', uploadError)
        throw uploadError
      }

      console.log('✅ 업로드 성공:', uploadData)

      // 2. Public URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath)

      console.log('2️⃣ Public URL 생성:', publicUrl)

      // 3. 미리보기 즉시 업데이트
      setLogoPreview(publicUrl)
      console.log('3️⃣ 미리보기 업데이트 완료')

      // 4. DB에 저장
      console.log('4️⃣ DB 저장 시도...')
      const { error: updateError } = await supabase
        .from('contractors')
        .update({ 
          company_logo: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('❌ DB 저장 실패:', updateError)
        
        // company_logo 컬럼이 없는 경우
        if (updateError.code === '42703') {
          toast.error('데이터베이스 설정 필요: add-profile-columns.sql을 실행하세요')
        } else {
          toast.warning('로고가 업로드되었지만 저장에 실패했습니다')
        }
      } else {
        console.log('✅ DB 저장 성공')
        toast.success('로고가 성공적으로 업로드되었습니다!')
        
        // 프로필 상태만 업데이트 (loadProfile 호출하지 않음)
        setProfile(prev => prev ? { ...prev, company_logo: publicUrl } : null)
      }
      
    } catch (error: any) {
      console.error('❌ 로고 업로드 중 오류:', error)
      setLogoPreview(null)
      toast.error(error.message || '로고 업로드에 실패했습니다')
    } finally {
      setIsUploadingLogo(false)
      console.log('📤 로고 업로드 프로세스 종료')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_in_business' ? parseInt(value) || 0 : value
    }))
  }

  const handleSpecialtiesChange = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const supabase = createBrowserClient()
      
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('contractors')
        .update(updateData)
        .eq('id', profile.id)

      if (error) throw error

      // 프로필 상태 업데이트 (loadProfile 호출하지 않음)
      setProfile(prev => prev ? { ...prev, ...updateData } : null)
      
      toast.success('프로필이 업데이트되었습니다!')
      
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('프로필 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const specialtyOptions = [
    '전체 리노베이션',
    '주방',
    '욕실',
    '지하실',
    '페인팅',
    '바닥재',
    '전기',
    '배관',
    '지붕',
    '외장'
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프로필 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/contractor')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                돌아가기
              </button>
            </div>
            <h1 className="text-xl font-semibold">프로필 관리</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 컨텐츠 */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* 로고 섹션 */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {isUploadingLogo ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-blue-600 mt-2 font-medium">업로드 중...</span>
                  </div>
                ) : logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ 이미지 로드 실패:', logoPreview)
                      toast.error('이미지를 불러올 수 없습니다')
                      setLogoPreview(null)
                    }}
                    onLoad={() => {
                      console.log('✅ 이미지 로드 성공')
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">로고 업로드</span>
                  </div>
                )}
              </div>
              <label 
                htmlFor="logo-upload" 
                className={`absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-all ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                title="로고 업로드"
              >
                <Camera className="h-5 w-5" />
                <input
                  id="logo-upload"
                  type="file"
                  accept={ALLOWED_IMAGE_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploadingLogo}
                />
              </label>
            </div>
            <p className="text-lg font-medium mt-4">{formData.company_name || 'Company Name'}</p>
            <p className="text-xs text-gray-500 mt-2">
              지원 형식: {ALLOWED_IMAGE_EXTENSIONS.join(', ').toUpperCase()} (최대 {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB)
            </p>
          </div>

          {/* 폼 섹션 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                회사명
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="회사명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                회사 소개
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="회사 소개를 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="전화번호를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="주소를 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  웹사이트
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  경력 (년)
                </label>
                <input
                  type="number"
                  name="years_in_business"
                  value={formData.years_in_business}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전문 분야
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtiesChange(specialty)}
                      className="mr-2 cursor-pointer"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업자 등록번호
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="사업자 등록번호"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  보험
                </label>
                <input
                  type="text"
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="보험 정보"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
