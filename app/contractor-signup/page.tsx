'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Building2, User, Phone, MapPin, Check } from 'lucide-react'
import { useAuth } from '@/lib/supabase/hooks'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function ContractorSignupPage() {
  console.log('ContractorSignupPage rendered')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    contactName: '',
    phone: '',
    address: '',
    specialties: [] as string[]
  })
  
  const router = useRouter()
  const { signUp } = useAuth()

  // 전문분야 옵션
  const specialtyOptions = [
    { value: 'residential', label: '주거공간' },
    { value: 'commercial', label: '상업공간' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    // 비밀번호 요구사항 확인
    const passwordRequirements = {
      minLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    }

    if (!Object.values(passwordRequirements).every(req => req)) {
      setError('비밀번호 요구사항을 모두 충족해야 합니다.')
      setIsLoading(false)
      return
    }

    // 필수 필드 확인
    if (!formData.businessName || !formData.contactName || !formData.phone || !formData.address || formData.specialties.length === 0) {
      setError('모든 필드를 입력하고 최소 하나의 전문분야를 선택해주세요.')
      setIsLoading(false)
      return
    }

    try {
      // 업체로 회원가입 (role: 'contractor')
      const { data, error } = await signUp(formData.email, formData.password, 'contractor')
      
      if (error) {
        setError(error.message)
      } else if (data.user) {
        // 업체 프로필 정보를 contractors 테이블에 직접 저장 (users 테이블에는 저장하지 않음)
        try {
          const supabase = createBrowserClient()
          const { error: contractorError } = await supabase
            .from('contractors')
            .insert({
              user_id: data.user.id,
              company_name: formData.businessName,
              contact_name: formData.contactName,
              phone: formData.phone,
              email: formData.email,
              address: formData.address,
              status: 'active',
              specialties: JSON.stringify(formData.specialties)::jsonb,
              years_experience: 0,
              portfolio_count: 0,
              rating: 0.0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (contractorError) {
            console.error('Contractors 테이블 저장 오류:', contractorError)
            throw new Error('업체 프로필 저장에 실패했습니다.')
          }

          alert('업체 회원가입이 완료되었습니다!')
          router.push('/')
        } catch (profileError) {
          console.error('업체 프로필 저장 오류:', profileError)
          setError('업체 프로필 저장 중 오류가 발생했습니다.')
        }
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 전문분야 선택 핸들러
  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty]
      })
    } else {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter(s => s !== specialty)
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 뒤로가기 버튼 */}
        <Link href="/" className="absolute top-4 left-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            업체 회원가입
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            전문 업체로 등록하여 고객들과 연결되세요
          </p>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          일반 고객이신가요?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            고객 회원가입
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 오류 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 사업체명 */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                사업체명 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="예: ABC 인테리어"
                />
              </div>
            </div>

            {/* 담당자명 */}
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                담당자명 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="예: 홍길동"
                />
              </div>
            </div>

            {/* 연락처 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                연락처 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>

            {/* 주소 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                사업장 주소 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="예: 서울시 강남구 테헤란로 123"
                />
              </div>
            </div>

            {/* 전문분야 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전문분야 * (다중선택 가능)
              </label>
              <div className="space-y-2">
                {specialtyOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(option.value)}
                      onChange={(e) => handleSpecialtyChange(option.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.specialties.length === 0 && (
                <p className="text-red-500 text-sm mt-1">최소 하나의 전문분야를 선택해주세요.</p>
              )}
            </div>

            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* 비밀번호 요구사항 */}
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600 font-medium mb-2">비밀번호 요구사항:</div>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    최소 8자 이상
                  </div>
                  <div className={`flex items-center text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    대문자 포함
                  </div>
                  <div className={`flex items-center text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    소문자 포함
                  </div>
                  <div className={`flex items-center text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    숫자 포함
                  </div>
                  <div className={`flex items-center text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    특수문자 포함
                  </div>
                </div>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-300 bg-green-50'
                      : formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* 비밀번호 일치 확인 */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.password === formData.confirmPassword ? (
                    <div className="flex items-center text-xs text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      비밀번호가 일치합니다
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-red-600">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                      비밀번호가 일치하지 않습니다
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 회원가입 버튼 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '업체 회원가입 중...' : '업체로 회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
