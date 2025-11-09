'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, CheckCircle } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    mobileNumber: ''
  })
  
  const router = useRouter()
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()

  // ✅ Google OAuth 로그인 함수 추가
  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError('')
    let hasError = false

    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (googleError) {
        console.error('Google signup error:', googleError)
        setError('Google 회원가입에 실패했습니다.')
        toast.error('Google 회원가입에 실패했습니다')
        hasError = true
      }
    } catch (error) {
      console.error('Google sign up error:', error)
      setError('Google 회원가입 중 오류가 발생했습니다.')
      toast.error('Google 회원가입 중 오류가 발생했습니다')
      hasError = true
    } finally {
      if (hasError) {
        setIsLoading(false)
      }
    }
  }

  // Format phone number to (XXX) XXX - XXXX format
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
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)} - ${limited.slice(6)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const previousValue = formData.mobileNumber
    const inputValue = input.value
    const cursorPosition = input.selectionStart || 0
    
    const cleaned = inputValue.replace(/\D/g, '')
    const previousCleaned = previousValue.replace(/\D/g, '')
    const isDeletion = cleaned.length < previousCleaned.length
    const formatted = formatPhoneNumber(inputValue)
    
    const beforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length
    
    let newCursorPosition = formatted.length
    let count = 0
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        count++
        if (count === beforeCursor) {
          newCursorPosition = isDeletion ? i + 1 : i + 1
          break
        }
      }
    }
    
    setFormData(prev => ({ ...prev, mobileNumber: formatted }))
    
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    // Required fields check
    if (!formData.firstName || !formData.lastName || !formData.mobileNumber) {
      setError('Please fill in all fields.')
      setIsLoading(false)
      return
    }

    // Password requirements check
    const passwordRequirements = {
      minLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    }

    if (!Object.values(passwordRequirements).every(req => req)) {
      setError('Password must meet all requirements.')
      setIsLoading(false)
      return
    }

    try {
      if (process.env.NODE_ENV === 'development') console.log('🚀 Starting signup process...')
      
      // 회원가입 시도 (user metadata에 추가 정보 저장)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.mobileNumber,
            user_type: 'customer'
          }
        }
      })
      
      if (process.env.NODE_ENV === 'development') console.log('✅ Signup response:', { 
        userId: data.user?.id, 
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        error 
      })
      
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }
      
      if (data.user) {
        // Database trigger가 자동으로 users 테이블에 레코드를 생성합니다
        // 추가 정보는 이메일 확인 후 업데이트됩니다
        
        if (process.env.NODE_ENV === 'development') console.log('✅ User created successfully - database trigger will handle users table')
        if (process.env.NODE_ENV === 'development') console.log('📧 Email confirmation required - showing confirmation screen')
        
        setUserEmail(formData.email)
        setEmailSent(true)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred during sign up.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 이메일 확인 안내 화면
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Check Your Email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We've sent a verification email to:
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {userEmail}
              </p>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Next Step:</strong> Click the verification link in your email to activate your account.
                </p>
              </div>
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  <strong>💡 Tip:</strong> After verifying your email, you can also sign in with Google using the same email address!
                </p>
              </div>
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p>• Check your spam folder if you don't see the email</p>
                <p>• The link will expire in 24 hours</p>
              </div>
              <div className="mt-8">
                <Link 
                  href="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="absolute top-4 left-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign In
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          Are you a professional contractor?{' '}
          <Link href="/contractor-signup" className="font-medium text-green-600 hover:text-green-500">
            Contractor Signup
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.05-4.71 1.05-3.62 0-6.69-2.44-7.79-5.72H.65v2.86C2.36 19.08 5.89 23 12 23z" />
              <path fill="#FBBC05" d="M4.21 14.28c-.28-.82-.44-1.69-.44-2.61 0-.92.16-1.79.44-2.61V6.2H.65C.24 7.01 0 7.99 0 9s.24 1.99.65 2.8l3.56 2.48z" />
              <path fill="#EA4335" d="M12 4.75c2.04 0 3.87.7 5.31 2.07l3.99-3.99C19.46 1.09 16.97 0 12 0 5.89 0 2.36 3.92.65 6.2l3.56 2.48C5.31 7.19 8.38 4.75 12 4.75z" />
            </svg>
            Sign up with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
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

            {/* Name input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="First Name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Last Name"
                  />
                </div>
              </div>
            </div>

            {/* Phone number input */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  ref={phoneInputRef}
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={handlePhoneChange}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="(416) 555 - 1234"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
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
              
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600 font-medium mb-2">Password Requirements:</div>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Contains uppercase letter
                  </div>
                  <div className={`flex items-center text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Contains lowercase letter
                  </div>
                  <div className={`flex items-center text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Contains number
                  </div>
                  <div className={`flex items-center text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Contains special character
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
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
              
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.password === formData.confirmPassword ? (
                    <div className="flex items-center text-xs text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-red-600">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sign up button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing up...
                  </div>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
