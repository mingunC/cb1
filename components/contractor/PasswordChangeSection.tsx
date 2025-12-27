'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { Eye, EyeOff, Lock, Save, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'

export default function PasswordChangeSection() {
  const t = useTranslations('contractor.profile.security')
  const tCommon = useTranslations('common')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // 비밀번호 유효성 검사
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push(t('validation.minLength'))
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push(t('validation.requireLetter'))
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push(t('validation.requireNumber'))
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!currentPassword.trim()) {
      toast.error(t('errors.currentPasswordRequired'))
      return
    }
    
    if (!newPassword.trim()) {
      toast.error(t('errors.newPasswordRequired'))
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t('errors.passwordsNotMatch'))
      return
    }
    
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.errors[0])
      return
    }
    
    if (currentPassword === newPassword) {
      toast.error(t('errors.samePassword'))
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createBrowserClient()
      
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user || !user.email) {
        toast.error(t('errors.userNotFound'))
        return
      }
      
      // 현재 비밀번호로 재인증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Invalid password')) {
          toast.error(t('errors.invalidCurrentPassword'))
        } else {
          toast.error(signInError.message)
        }
        return
      }
      
      // 비밀번호 변경
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateError) {
        toast.error(updateError.message || t('errors.updateFailed'))
        return
      }
      
      // 성공
      toast.success(t('success'))
      
      // 폼 초기화
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (error: any) {
      console.error('Password change error:', error)
      toast.error(error.message || t('errors.updateFailed'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const passwordValidation = validatePassword(newPassword)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const showPasswordStrength = newPassword.length > 0
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          {t('title')}
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          {t('description')}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 현재 비밀번호 */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
            {t('currentPassword')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder={t('currentPasswordPlaceholder')}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* 새 비밀번호 */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            {t('newPassword')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder={t('newPasswordPlaceholder')}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* 비밀번호 요구사항 */}
          {showPasswordStrength && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">{t('requirements.title')}</p>
              <ul className="space-y-1 text-xs">
                <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{newPassword.length >= 8 ? '✓' : '○'}</span>
                  {t('requirements.minLength')}
                </li>
                <li className={`flex items-center ${/[a-zA-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{/[a-zA-Z]/.test(newPassword) ? '✓' : '○'}</span>
                  {t('requirements.letter')}
                </li>
                <li className={`flex items-center ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                  {t('requirements.number')}
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* 비밀번호 확인 */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            {t('confirmPassword')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                confirmPassword && !passwordsMatch ? 'border-red-300' : ''
              }`}
              placeholder={t('confirmPasswordPlaceholder')}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* 비밀번호 일치 확인 */}
          {confirmPassword && (
            <div className="mt-2">
              {passwordsMatch ? (
                <p className="text-xs text-green-600 flex items-center">
                  <span className="mr-1">✓</span>
                  {t('passwordsMatch')}
                </p>
              ) : (
                <p className="text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('passwordsNotMatch')}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* 제출 버튼 */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || !passwordValidation.valid || !passwordsMatch}
            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {tCommon('saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('changePassword')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

