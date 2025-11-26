'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Building2, User, Phone, MapPin, Check } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

export default function ContractorSignupPage() {
  const t = useTranslations('contractorSignup')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState&lt;any&gt;(null)
  const [isExistingUser, setIsExistingUser] = useState(false)
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
  const supabase = createBrowserClient()
  const phoneInputRef = useRef&lt;HTMLInputElement&gt;(null)

  // Format phone number to (XXX) XXX - XXXX format
  const formatPhoneNumber = (value: string) => {
    // Extract only digits
    const cleaned = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10)
    
    // Format as (XXX) XXX - XXXX
    if (limited.length === 0) {
      return ''
    } else if (limited.length &lt;= 3) {
      return `(${limited})`
    } else if (limited.length &lt;= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)} - ${limited.slice(6)}`
    }
  }

  // Handle phone number input change with cursor position management
  const handlePhoneChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) => {
    const input = e.target
    const previousValue = formData.phone
    const inputValue = input.value
    const cursorPosition = input.selectionStart || 0
    
    // Extract only digits
    const cleaned = inputValue.replace(/\D/g, '')
    const previousCleaned = previousValue.replace(/\D/g, '')
    
    // Check if it's a deletion (going backwards)
    const isDeletion = cleaned.length &lt; previousCleaned.length
    
    // Apply formatting
    const formatted = formatPhoneNumber(inputValue)
    
    // Calculate cursor position: count digits before cursor
    const beforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length
    
    // Find position in formatted string
    let newCursorPosition = formatted.length
    let count = 0
    for (let i = 0; i &lt; formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        count++
        if (count === beforeCursor) {
          // If deletion, position after the digit; if insertion, position after format character
          newCursorPosition = isDeletion ? i + 1 : i + 1
          break
        }
      }
    }
    
    // Update state
    setFormData(prev => ({ ...prev, phone: formatted }))
    
    // Restore cursor position
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  // Specialty options
  const specialtyOptions = [
    { value: 'residential', label: t('residential') },
    { value: 'commercial', label: t('commercial') }
  ]

  // 현재 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          if (process.env.NODE_ENV === 'development') console.log('✅ 이미 로그인된 사용자:', session.user.email)
          setCurrentUser(session.user)
          setIsExistingUser(true)
          
          // 이메일 자동 입력
          setFormData(prev => ({
            ...prev,
            email: session.user.email || ''
          }))
          
          // 이미 contractor인지 확인
          const { data: contractorData } = await supabase
            .from('contractors')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle()
          
          if (contractorData) {
            if (process.env.NODE_ENV === 'development') console.log('⚠️ 이미 contractor로 등록되어 있음')
            toast.error(t('alreadyRegistered'))
            router.push('/contractor')
            return
          }
        } else {
          if (process.env.NODE_ENV === 'development') console.log('ℹ️ 로그인되지 않은 사용자 - 전체 회원가입 필요')
          setIsExistingUser(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthStatus()
  }, [supabase, router, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (process.env.NODE_ENV === 'development') console.log('🚀 폼 제출 시작:', {
      businessName: formData.businessName,
      contactName: formData.contactName,
      specialties: formData.specialties,
      isExistingUser
    })

    // 입력 검증
    if (!formData.businessName || !formData.contactName || !formData.phone || !formData.address || formData.specialties.length === 0) {
      setError(t('validation.fillAllFields'))
      setIsLoading(false)
      return
    }

    // 신규 회원가입인 경우 비밀번호 검증
    if (!isExistingUser) {
      if (formData.password !== formData.confirmPassword) {
        setError(t('validation.passwordsNotMatch'))
        setIsLoading(false)
        return
      }

      const passwordRequirements = {
        minLength: formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasLowerCase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecialChar: /[!@#$%^&amp;*(),.?\":{}|&lt;&gt;]/.test(formData.password)
      }

      if (!Object.values(passwordRequirements).every(req => req)) {
        setError(t('validation.meetPasswordRequirements'))
        setIsLoading(false)
        return
      }
    }

    try {
      let userId = currentUser?.id

      // 신규 회원가입인 경우
      if (!isExistingUser) {
        if (process.env.NODE_ENV === 'development') console.log('📝 신규 회원가입 진행 중...')
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })
        
        if (signUpError) {
          console.error('❌ 회원가입 오류:', signUpError)
          setError(signUpError.message)
          setIsLoading(false)
          return
        }
        
        if (!data.user) {
          setError(t('errors.failedToCreate'))
          setIsLoading(false)
          return
        }
        
        userId = data.user.id
        if (process.env.NODE_ENV === 'development') console.log('✅ 회원가입 완료, userId:', userId)
      }

      if (process.env.NODE_ENV === 'development') console.log('📝 users 테이블 업데이트 중...')
      // users 테이블 업데이트 (upsert 사용)
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: formData.email,
          user_type: 'contractor',
          first_name: formData.contactName.split(' ')[0] || formData.contactName,
          last_name: formData.contactName.split(' ').slice(1).join(' ') || '',
          phone: formData.phone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (userError) {
        console.error('❌ users 테이블 upsert 오류:', userError)
        throw new Error(t('errors.failedToUpdate') + userError.message)
      }
      if (process.env.NODE_ENV === 'development') console.log('✅ users 테이블 업데이트 완료')

      if (process.env.NODE_ENV === 'development') console.log('📝 contractors 테이블에 저장 중...')
      // contractors 테이블에 업체 정보 저장
      const contractorData = {
        user_id: userId,
        company_name: formData.businessName,
        contact_name: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        status: 'active',
        specialties: JSON.stringify(formData.specialties), // JSONB를 위해 JSON.stringify 사용
        years_experience: 0,
        portfolio_count: 0,
        rating: 0.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (process.env.NODE_ENV === 'development') console.log('📤 contractors 테이블 데이터:', contractorData)

      const { error: contractorError } = await supabase
        .from('contractors')
        .insert(contractorData)

      if (contractorError) {
        console.error('❌ contractors 테이블 insert 오류:', contractorError)
        throw new Error(t('errors.failedToSave') + contractorError.message)
      }

      if (process.env.NODE_ENV === 'development') console.log('✅ Contractor 등록 완료!')
      toast.success(t('registrationCompleted'))
      
      // localStorage 캐시 업데이트
      localStorage.setItem('cached_user_type', 'contractor')
      localStorage.setItem('cached_user_name', formData.businessName)
      
      router.push('/contractor')
      
    } catch (err: any) {
      console.error('❌ Signup error:', err)
      setError(err.message || t('errors.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

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

  // 로딩 중
  if (checkingAuth) {
    return (
      &lt;div className="min-h-screen bg-gray-50 flex items-center justify-center"&gt;
        &lt;div className="text-center"&gt;
          &lt;div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"&gt;&lt;/div&gt;
          &lt;p className="mt-4 text-gray-600"&gt;{t('checkingAuth')}&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    )
  }

  return (
    &lt;div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"&gt;
      &lt;div className="sm:mx-auto sm:w-full sm:max-w-md"&gt;
        &lt;Link href="/" className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"&gt;
          &lt;ArrowLeft className="h-6 w-6" /&gt;
        &lt;/Link&gt;
        &lt;div className="text-center"&gt;
          &lt;Building2 className="mx-auto h-12 w-12 text-blue-600" /&gt;
          &lt;h2 className="mt-6 text-3xl font-extrabold text-gray-900"&gt;
            {isExistingUser ? t('completeProfile') : t('title')}
          &lt;/h2&gt;
          &lt;p className="mt-2 text-sm text-gray-600"&gt;
            {isExistingUser 
              ? t('subtitleExisting')
              : t('subtitle')
            }
          &lt;/p&gt;
        &lt;/div&gt;
        {!isExistingUser &amp;&amp; (
          &lt;&gt;
            &lt;p className="mt-2 text-center text-sm text-gray-600"&gt;
              {t('areYouCustomer')}{' '}
              &lt;Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500"&gt;
                {t('customerSignup')}
              &lt;/Link&gt;
            &lt;/p&gt;
            &lt;p className="mt-1 text-center text-sm text-gray-600"&gt;
              {t('alreadyHaveAccount')}{' '}
              &lt;Link href="/contractor-login" className="font-medium text-blue-600 hover:text-blue-500"&gt;
                {t('contractorLogin')}
              &lt;/Link&gt;
            &lt;/p&gt;
          &lt;/&gt;
        )}
      &lt;/div&gt;

      &lt;div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"&gt;
        &lt;div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"&gt;
          {/* 이미 로그인된 사용자 알림 */}
          {isExistingUser &amp;&amp; (
            &lt;div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start"&gt;
              &lt;Check className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" /&gt;
              &lt;div&gt;
                &lt;p className="text-sm text-blue-800 font-medium"&gt;{t('alreadyLoggedIn')}&lt;/p&gt;
                &lt;p className="text-xs text-blue-600 mt-1"&gt;
                  {t('loggedInAs', { email: currentUser?.email })}
                &lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          )}

          {error &amp;&amp; (
            &lt;div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start"&gt;
              &lt;AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" /&gt;
              &lt;span className="text-sm text-red-600"&gt;{error}&lt;/span&gt;
            &lt;/div&gt;
          )}

          &lt;form className="space-y-6" onSubmit={handleSubmit}&gt;
            {/* Business Information Section */}
            &lt;div className="space-y-4"&gt;
              &lt;h3 className="text-lg font-medium text-gray-900 border-b pb-2"&gt;{t('businessInfo')}&lt;/h3&gt;
              
              {/* Business name */}
              &lt;div&gt;
                &lt;label htmlFor="businessName" className="block text-sm font-medium text-gray-700"&gt;
                  {t('businessName')} *
                &lt;/label&gt;
                &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                  &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                    &lt;Building2 className="h-5 w-5 text-gray-400" /&gt;
                  &lt;/div&gt;
                  &lt;input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('businessNamePlaceholder')}
                  /&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              {/* Contact name */}
              &lt;div&gt;
                &lt;label htmlFor="contactName" className="block text-sm font-medium text-gray-700"&gt;
                  {t('contactName')} *
                &lt;/label&gt;
                &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                  &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                    &lt;User className="h-5 w-5 text-gray-400" /&gt;
                  &lt;/div&gt;
                  &lt;input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('contactNamePlaceholder')}
                  /&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              {/* Phone Number */}
              &lt;div&gt;
                &lt;label htmlFor="phone" className="block text-sm font-medium text-gray-700"&gt;
                  {t('phoneNumber')} *
                &lt;/label&gt;
                &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                  &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                    &lt;Phone className="h-5 w-5 text-gray-400" /&gt;
                  &lt;/div&gt;
                  &lt;input
                    ref={phoneInputRef}
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('phoneNumberPlaceholder')}
                  /&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              {/* Address */}
              &lt;div&gt;
                &lt;label htmlFor="address" className="block text-sm font-medium text-gray-700"&gt;
                  {t('businessAddress')} *
                &lt;/label&gt;
                &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                  &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                    &lt;MapPin className="h-5 w-5 text-gray-400" /&gt;
                  &lt;/div&gt;
                  &lt;input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('businessAddressPlaceholder')}
                  /&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              {/* Specialties */}
              &lt;div&gt;
                &lt;label className="block text-sm font-medium text-gray-700 mb-2"&gt;
                  {t('specialties')} * {t('specialtiesNote')}
                &lt;/label&gt;
                &lt;div className="space-y-2"&gt;
                  {specialtyOptions.map((option) =&gt; (
                    &lt;label key={option.value} className="flex items-center"&gt;
                      &lt;input
                        type="checkbox"
                        checked={formData.specialties.includes(option.value)}
                        onChange={(e) =&gt; handleSpecialtyChange(option.value, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      /&gt;
                      &lt;span className="ml-2 text-sm text-gray-700"&gt;{option.label}&lt;/span&gt;
                    &lt;/label&gt;
                  ))}
                &lt;/div&gt;
                {formData.specialties.length === 0 &amp;&amp; (
                  &lt;p className="text-red-500 text-sm mt-1"&gt;{t('selectSpecialty')}&lt;/p&gt;
                )}
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Account Information Section - Only for new users */}
            {!isExistingUser &amp;&amp; (
              &lt;div className="space-y-4 pt-4 border-t"&gt;
                &lt;h3 className="text-lg font-medium text-gray-900"&gt;{t('accountInfo')}&lt;/h3&gt;
                
                {/* Email */}
                &lt;div&gt;
                  &lt;label htmlFor="email" className="block text-sm font-medium text-gray-700"&gt;
                    {t('email')} *
                  &lt;/label&gt;
                  &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                    &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                      &lt;Mail className="h-5 w-5 text-gray-400" /&gt;
                    &lt;/div&gt;
                    &lt;input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={t('emailPlaceholder')}
                    /&gt;
                  &lt;/div&gt;
                &lt;/div&gt;

                {/* Password */}
                &lt;div&gt;
                  &lt;label htmlFor="password" className="block text-sm font-medium text-gray-700"&gt;
                    {t('password')} *
                  &lt;/label&gt;
                  &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                    &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                      &lt;Lock className="h-5 w-5 text-gray-400" /&gt;
                    &lt;/div&gt;
                    &lt;input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    /&gt;
                    &lt;button
                      type="button"
                      onClick={() =&gt; setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    &gt;
                      {showPassword ? &lt;EyeOff className="h-5 w-5 text-gray-400" /&gt; : &lt;Eye className="h-5 w-5 text-gray-400" /&gt;}
                    &lt;/button&gt;
                  &lt;/div&gt;
                  
                  {/* Password requirements */}
                  &lt;div className="mt-2 space-y-1"&gt;
                    &lt;div className="text-xs text-gray-600 font-medium mb-2"&gt;{t('passwordRequirements')}&lt;/div&gt;
                    &lt;div className="space-y-1"&gt;
                      &lt;div className={`flex items-center text-xs ${formData.password.length &gt;= 8 ? 'text-green-600' : 'text-gray-500'}`}&gt;
                        &lt;div className={`w-2 h-2 rounded-full mr-2 ${formData.password.length &gt;= 8 ? 'bg-green-500' : 'bg-gray-300'}`}&gt;&lt;/div&gt;
                        {t('minLength')}
                      &lt;/div&gt;
                      &lt;div className={`flex items-center text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}&gt;
                        &lt;div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}&gt;&lt;/div&gt;
                        {t('hasUpperCase')}
                      &lt;/div&gt;
                      &lt;div className={`flex items-center text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}&gt;
                        &lt;div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}&gt;&lt;/div&gt;
                        {t('hasLowerCase')}
                      &lt;/div&gt;
                      &lt;div className={`flex items-center text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}&gt;
                        &lt;div className={`w-2 h-2 rounded-full mr-2 ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}&gt;&lt;/div&gt;
                        {t('hasNumber')}
                      &lt;/div&gt;
                      &lt;div className={`flex items-center text-xs ${/[!@#$%^&amp;*(),.?\":{}|&lt;&gt;]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}&gt;
                        &lt;div className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&amp;*(),.?\":{}|&lt;&gt;]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}&gt;&lt;/div&gt;
                        {t('hasSpecialChar')}
                      &lt;/div&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;

                {/* Confirm password */}
                &lt;div&gt;
                  &lt;label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700"&gt;
                    {t('confirmPassword')} *
                  &lt;/label&gt;
                  &lt;div className="mt-1 relative rounded-md shadow-sm"&gt;
                    &lt;div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"&gt;
                      &lt;Lock className="h-5 w-5 text-gray-400" /&gt;
                    &lt;/div&gt;
                    &lt;input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        formData.confirmPassword &amp;&amp; formData.password === formData.confirmPassword
                          ? 'border-green-300 bg-green-50'
                          : formData.confirmPassword &amp;&amp; formData.password !== formData.confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                    /&gt;
                    &lt;button
                      type="button"
                      onClick={() =&gt; setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    &gt;
                      {showConfirmPassword ? &lt;EyeOff className="h-5 w-5 text-gray-400" /&gt; : &lt;Eye className="h-5 w-5 text-gray-400" /&gt;}
                    &lt;/button&gt;
                  &lt;/div&gt;
                  
                  {formData.confirmPassword &amp;&amp; (
                    &lt;div className="mt-2"&gt;
                      {formData.password === formData.confirmPassword ? (
                        &lt;div className="flex items-center text-xs text-green-600"&gt;
                          &lt;div className="w-2 h-2 rounded-full bg-green-500 mr-2"&gt;&lt;/div&gt;
                          {t('passwordsMatch')}
                        &lt;/div&gt;
                      ) : (
                        &lt;div className="flex items-center text-xs text-red-600"&gt;
                          &lt;div className="w-2 h-2 rounded-full bg-red-500 mr-2"&gt;&lt;/div&gt;
                          {t('passwordsNotMatch')}
                        &lt;/div&gt;
                      )}
                    &lt;/div&gt;
                  )}
                &lt;/div&gt;
              &lt;/div&gt;
            )}

            {/* Submit */}
            &lt;div&gt;
              &lt;button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              &gt;
                {isLoading ? (
                  &lt;&gt;
                    &lt;div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" /&gt;
                    {isExistingUser ? t('completingRegistration') : t('signingUp')}
                  &lt;/&gt;
                ) : (
                  isExistingUser ? t('completeRegistration') : t('signUpAsContractor')
                )}
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/form&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  )
}
