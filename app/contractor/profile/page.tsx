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
        console.log('🔍 Raw specialties from DB:', contractor.specialties)
        
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
      toast.error('Company name is required')
      return
    }

    setIsSaving(true)
    console.log('💾 Profile save started...')
    
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

      console.log('📝 Update data:', updateData)
      console.log('🆔 Profile ID:', profile.id)

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

        console.log('✅ Save successful!')
        setProfile(prev => prev ? { ...prev, ...updateData } : null)
        toast.success('Profile updated successfully!')
        
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
      toast.error(`Profile save failed: ${error.message || 'Unknown error'}`)
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
