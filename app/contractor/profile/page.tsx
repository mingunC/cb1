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

// Allowed image file extensions
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
        console.error('Profile load error:', error)
        throw error
      }

      if (contractor) {
        setProfile(contractor)
        
        // specialties 파싱 (JSON 문자열인 경우 처리)
        console.log('🔍 Raw specialties from DB:', contractor.specialties)
        console.log('🔍 Type:', typeof contractor.specialties, Array.isArray(contractor.specialties))
        
        let parsedSpecialties: string[] = []
        if (contractor.specialties) {
          if (Array.isArray(contractor.specialties)) {
            parsedSpecialties = contractor.specialties
          } else if (typeof contractor.specialties === 'string') {
            try {
              console.log('🔍 Parsing string:', contractor.specialties)
              parsedSpecialties = JSON.parse(contractor.specialties)
            } catch (e) {
              console.error('Failed to parse specialties:', e)
              console.error('Raw value:', contractor.specialties)
              parsedSpecialties = []
            }
          }
        }
        console.log('✅ Parsed specialties:', parsedSpecialties)
        
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
        
        // Set logo preview if URL exists
        if (contractor.company_logo) {
          console.log('✅ Logo URL loaded:', contractor.company_logo)
          setLogoPreview(contractor.company_logo)
        }
      }
    } catch (error: any) {
      console.error('Profile load failed:', error)
      if (error.code === '42703') {
        toast.error('Database setup error: Please run add-profile-columns.sql.')
      } else {
        toast.error('Failed to load profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

      // Reset file input (allow reselecting same file)
      event.target.value = ''

    // Validate file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      toast.error(`Unsupported file format. Supported: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB or less`)
      return
    }

    if (!profile) {
      toast.error('Cannot load profile information')
      return
    }

    setIsUploadingLogo(true)
    console.log('📤 Logo upload started...')
    
    try {
      const supabase = createBrowserClient()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `contractor-logos/${fileName}`

      // 1. Upload file
      console.log('1️⃣ Uploading file:', filePath)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('portfolios')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError)
        throw uploadError
      }

      console.log('✅ Upload successful:', uploadData)

      // 2. Generate public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath)

      console.log('2️⃣ Public URL generated:', publicUrl)

      // 3. Update preview immediately
      setLogoPreview(publicUrl)
      console.log('3️⃣ Preview updated')

      // 4. Save to DB
      console.log('4️⃣ Saving to DB...')
      const { error: updateError } = await supabase
        .from('contractors')
        .update({ 
          company_logo: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('❌ DB save failed:', updateError)
        
        // If company_logo column doesn't exist
        if (updateError.code === '42703') {
          toast.error('Database setup required: Please run add-profile-columns.sql')
        } else {
          toast.warning('Logo uploaded but failed to save')
        }
      } else {
        console.log('✅ DB save successful')
        toast.success('Logo uploaded successfully!')
        
        // Update profile state only (don't call loadProfile)
        setProfile(prev => prev ? { ...prev, company_logo: publicUrl } : null)
      }
      
    } catch (error: any) {
      console.error('❌ Logo upload error:', error)
      setLogoPreview(null)
      toast.error(error.message || 'Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
      console.log('📤 Logo upload process ended')
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

    // ✅ 유효성 검사 추가
    if (!formData.company_name.trim()) {
      toast.error('Company name is required')
      return
    }

    setIsSaving(true)
    console.log('💾 Profile save started...')
    console.log('Data to save:', formData)
    
    try {
      const supabase = createBrowserClient()
      
      // 🔥 수정: 모든 필드 포함
      const updateData = {
        company_name: formData.company_name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        website: formData.website.trim(),
        specialties: formData.specialties, // ✅ 배열 그대로 저장
        years_in_business: formData.years_in_business,
        license_number: formData.license_number.trim(),
        insurance: formData.insurance.trim()
      }

      console.log('📝 Attempting DB update:', updateData)
      console.log('Profile ID:', profile.id)
      console.log('Specialties type:', Array.isArray(formData.specialties) ? 'Array' : typeof formData.specialties)
      console.log('Specialties data:', formData.specialties)

      // 타임아웃 처리
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초

      const { data, error } = await supabase
        .from('contractors')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.error('❌ Save error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        
        // Handle specific errors
        if (error.code === '42703') {
          toast.error('Database column missing. Please contact administrator.')
        } else if (error.code === '42501') {
          toast.error('Permission denied. Please check RLS policies.')
        } else if (error.code === 'PGRST116') {
          toast.error('Update conflict. Please refresh and try again.')
        } else if (error.name === 'AbortError') {
          toast.error('Save is taking too long. Please check your connection and try again.')
        } else {
          toast.error(`Save failed: ${error.message}`)
        }
        return
      }

      // Success
      console.log('✅ Save successful!', data)
      setProfile(prev => prev ? { ...prev, ...updateData } : null)
      toast.success('Profile updated successfully!')
      
    } catch (error: any) {
      console.error('❌ Unexpected error:', error)
      if (error.name === 'AbortError') {
        toast.error('Save is taking too long. Please check your connection and try again.')
      } else {
        toast.error(`Profile save failed: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsSaving(false)
      console.log('💾 Profile save process ended')
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
                Back
              </button>
            </div>
            <h1 className="text-xl font-semibold">Profile Management</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
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
                    onError={(e) => {
                      console.error('❌ Image load failed:', logoPreview)
                      toast.error('Cannot load image')
                      setLogoPreview(null)
                    }}
                    onLoad={() => {
                      console.log('✅ Image load successful')
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
            <p className="text-lg font-medium mt-4">{formData.company_name || 'Company Name'}</p>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: {ALLOWED_IMAGE_EXTENSIONS.join(', ').toUpperCase()} (Max {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB)
            </p>
          </div>

          {/* Form section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter company description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
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
                  Years in Business
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
                Specialties
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
                  Business License Number
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter business license number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance
                </label>
                <input
                  type="text"
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter insurance information"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
