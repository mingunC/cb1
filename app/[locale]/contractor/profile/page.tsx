'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Camera, Save, Trash2, AlertTriangle, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

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

// Allowed image file extensions
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function ContractorProfile() {
  const t = useTranslations('contractor.profile')
  const tCommon = useTranslations('common')
  const tSpecialties = useTranslations('specialties')
  const tDangerZone = useTranslations('contractor.dangerZone')
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

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'warning' | 'confirm'>('warning')

  useEffect(() => {
    loadProfile()
  }, [])

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
        console.error('Profile load error:', error)
        throw error
      }

      if (contractor) {
        setProfile(contractor)
        
        // specialties 파싱
        if (process.env.NODE_ENV === 'development') console.log('🔍 Raw specialties from DB:', contractor.specialties)
        
        let parsedSpecialties: string[] = []
        if (contractor.specialties) {
          if (Array.isArray(contractor.specialties)) {
            parsedSpecialties = contractor.specialties
          } else if (typeof contractor.specialties === 'string') {
            try {
              parsedSpecialties = JSON.parse(contractor.specialties)
            } catch (e) {
              console.error('Failed to parse specialties:', e)
              parsedSpecialties = []
            }
          }
        }
        
        setFormData({
          company_name: contractor.company_name || '',
          description: contractor.description || '',
          phone: contractor.phone || '',
          email: contractor.email || session.user.email || '',
          address: contractor.address || '',
          website: contractor.website || '',
          specialties: parsedSpecialties,
          years_in_business: contractor.years_in_business || 0,
          license_number: contractor.license_number || '',
          insurance: contractor.insurance || ''
        })
        
        if (contractor.company_logo) {
          setLogoPreview(contractor.company_logo)
        }
      }
    } catch (error: any) {
      console.error('Profile load failed:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      toast.error(`Unsupported file format. Supported: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB or less`)
      return
    }

    if (!profile) {
      toast.error('Cannot load profile information')
      return
    }

    setIsUploadingLogo(true)
    
    try {
      const supabase = createBrowserClient()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `contractor-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath)

      setLogoPreview(publicUrl)

      const { error: updateError } = await supabase
        .from('contractors')
        .update({ company_logo: publicUrl })
        .eq('id', profile.id)

      if (updateError) {
        toast.warning('Logo uploaded but failed to save')
      } else {
        toast.success('Logo uploaded successfully!')
        setProfile(prev => prev ? { ...prev, company_logo: publicUrl } : null)
      }
      
    } catch (error: any) {
      console.error('Logo upload error:', error)
      setLogoPreview(null)
      toast.error(error.message || 'Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
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
    if (!profile) {
      toast.error('No profile information available')
      return
    }

    if (!formData.company_name.trim()) {
      toast.error(t('companyNameRequired'))
      return
    }

    setIsSaving(true)
    if (process.env.NODE_ENV === 'development') console.log('💾 Profile save started...')
    
    try {
      const supabase = createBrowserClient()
      
      const updateData = {
        company_name: formData.company_name.trim(),
        description: formData.description.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        website: formData.website.trim() || null,
        specialties: formData.specialties,
        years_in_business: formData.years_in_business || 0,
        license_number: formData.license_number.trim() || null,
        insurance: formData.insurance.trim() || null
      }

      if (process.env.NODE_ENV === 'development') console.log('📝 Update data:', updateData)
      if (process.env.NODE_ENV === 'development') console.log('🆔 Profile ID:', profile.id)

      // ✅ 수정: 타임아웃 처리를 더 명확하게
      const timeoutMs = 15000 // 15초
      let timeoutId: NodeJS.Timeout

      const updatePromise = supabase
        .from('contractors')
        .update(updateData)
        .eq('id', profile.id)

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timeout - the update is taking too long'))
        }, timeoutMs)
      })

      try {
        const result = await Promise.race([updatePromise, timeoutPromise]) as any
        clearTimeout(timeoutId!)

        const { error } = result

        if (error) {
          console.error('❌ Save error:', error)
          
          if (error.code === '42501') {
            toast.error('Permission denied. Please re-login.')
          } else if (error.code === 'PGRST116') {
            toast.error('Profile not found. Please refresh the page.')
          } else {
            toast.error(`Save failed: ${error.message}`)
          }
          return
        }

        if (process.env.NODE_ENV === 'development') console.log('✅ Save successful!')
        setProfile(prev => prev ? { ...prev, ...updateData } : null)
        toast.success(t('profileSaved'))
        
      } catch (raceError: any) {
        clearTimeout(timeoutId!)
        
        if (raceError.message.includes('timeout')) {
          console.error('❌ Timeout error')
          toast.error('Save is taking too long. Please check your connection and try again.')
        } else {
          throw raceError
        }
      }
      
    } catch (error: any) {
      console.error('❌ Unexpected error:', error)
      toast.error(t('saveFailed'))
    } finally {
      setIsSaving(false)
      if (process.env.NODE_ENV === 'development') console.log('💾 Profile save process ended')
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error(t('deleteAccount.enterPasswordError'))
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error messages
        if (data.error?.includes('pending quotes')) {
          toast.error(t('deleteAccount.pendingQuotesError'))
        } else if (data.error?.includes('active projects')) {
          toast.error(t('deleteAccount.activeProjectsError'))
        } else if (data.error?.includes('Invalid password')) {
          toast.error(t('deleteAccount.invalidPassword'))
        } else {
          toast.error(data.error || t('deleteAccount.deleteFailed'))
        }
        return
      }

      toast.success(t('deleteAccount.deleteSuccess'))
      
      // Redirect to home page
      setTimeout(() => {
        router.push('/')
      }, 1500)

    } catch (error: any) {
      console.error('Delete account error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
    setDeleteStep('warning')
    setDeletePassword('')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteStep('warning')
    setDeletePassword('')
    setShowPassword(false)
  }

  const specialtyOptions = [
    'Full Renovation',
    'Kitchen',
    'Bathroom',
    'Basement',
    'Painting',
    'Flooring',
    'Electrical',
    'Plumbing',
    'Roofing',
    'Exterior'
  ]

  const getSpecialtyLabel = (specialty: string) => {
    const key = specialty.toLowerCase().replace(/\s+/g, '') as keyof typeof tSpecialties
    return tSpecialties(key) || specialty
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/contractor')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {tCommon('back')}
              </button>
            </div>
            <h1 className="text-xl font-semibold">{t('title')}</h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* Profile content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Logo section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {isUploadingLogo ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-blue-600 mt-2 font-medium">Uploading...</span>
                  </div>
                ) : logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error('Image load failed')
                      setLogoPreview(null)
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Upload Logo</span>
                  </div>
                )}
              </div>
              <label 
                htmlFor="logo-upload" 
                className={`absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-all ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                title="Upload Logo"
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
            <p className="text-lg font-medium mt-4">{formData.company_name || t('companyName')}</p>
            <p className="text-xs text-gray-500 mt-2">
              {t('supportedFormats')}
            </p>
          </div>

          {/* Form section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={t('companyName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyDescription')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={t('companyDescriptionPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t('phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t('email')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('address')}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={t('address')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('website')}
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t('websitePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('yearsInBusiness')}
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
                {t('specialties')}
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
                    <span className="text-sm">{getSpecialtyLabel(specialty)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('businessLicenseNumber')}
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t('businessLicensePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('insurance')}
                </label>
                <input
                  type="text"
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t('insurancePlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? tCommon('saving') : tCommon('save')}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-8 border border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {tDangerZone('title')}
          </h2>
          <p className="text-gray-600 mb-4">
            {tDangerZone('description')}
          </p>
          <button
            type="button"
            onClick={openDeleteModal}
            className="flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {tDangerZone('deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                {t('deleteAccount.title')}
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {deleteStep === 'warning' ? (
                <>
                  {/* Warning Step */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-red-800 mb-2">⚠️ {t('deleteAccount.warning')}</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      <li>• {t('deleteAccount.warningItems.cannotUndone')}</li>
                      <li>• {t('deleteAccount.warningItems.profileDeleted')}</li>
                      <li>• {t('deleteAccount.warningItems.portfolioRemoved')}</li>
                      <li>• {t('deleteAccount.warningItems.loseAccess')}</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-yellow-800 mb-2">📋 {t('deleteAccount.beforeProceed')}</h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                      <li>• {t('deleteAccount.beforeProceedItems.pendingQuotes')}</li>
                      <li>• {t('deleteAccount.beforeProceedItems.activeProjects')}</li>
                      <li>• {t('deleteAccount.beforeProceedItems.withdrawFirst')}</li>
                    </ul>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {t('deleteAccount.confirmQuestion')}
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={() => setDeleteStep('confirm')}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {tCommon('continue')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Confirm Step */}
                  <p className="text-gray-600 mb-4">
                    {t('deleteAccount.enterPassword')}
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        placeholder={t('passwordPlaceholder')}
                        disabled={isDeleting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteStep('warning')}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {tCommon('back')}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword.trim()}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('deleteAccount.deleting')}
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('deleteAccount.deleteMyAccount')}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
