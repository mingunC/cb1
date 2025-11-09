'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'

interface QuoteFormData {
  spaceType: string
  projectTypes: string[]
  budget: string
  timeline: string
  postalCode: string
  fullAddress: string
  visitDate: string
  description: string
  phone: string
}

const spaceTypes = [
  { value: 'detached_house', label: 'Detached House' },
  { value: 'town_house', label: 'Town House' },
  { value: 'condo', label: 'Condo & Apartment' },
  { value: 'commercial', label: 'Commercial' }
]

const residentialProjectTypes = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'basement', label: 'Basement' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'painting', label: 'Painting' },
  { value: 'full_renovation', label: 'Full Renovation', exclusive: true },
  { value: 'other', label: 'Other', exclusive: true }
]

const commercialProjectTypes = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'other', label: 'Other' }
]

const budgetRanges = [
  { value: 'under_50k', label: 'Under $50,000', subtitle: 'Small renovation' },
  { value: '50k_100k', label: '$50,000 - $100,000', subtitle: 'Medium renovation' },
  { value: 'over_100k', label: '$100,000+', subtitle: 'Large renovation' }
]

const timelines = [
  { value: 'immediate', label: 'Immediate', subtitle: 'As soon as possible' },
  { value: '1_month', label: 'Within 1 month', subtitle: 'Within a month' },
  { value: '3_months', label: 'Within 3 months', subtitle: 'Within 3 months' },
  { value: 'planning', label: 'Planning stage', subtitle: 'Still planning' }
]

export default function QuoteRequestForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<QuoteFormData>({
    spaceType: '',
    projectTypes: [],
    budget: '',
    timeline: '',
    postalCode: '',
    fullAddress: '',
    visitDate: '',
    description: '',
    phone: ''
  })

  const onSubmit = async (e?: React.FormEvent) => {
    // Prevent default form submission
    if (e) {
      e.preventDefault()
    }
    
    // Prevent duplicate submission
    if (isSubmitting) {
      if (process.env.NODE_ENV === 'development') console.log('Already submitting, ignoring duplicate call')
      return
    }
    
    setIsSubmitting(true)
    if (process.env.NODE_ENV === 'development') console.log('=== STARTING QUOTE SUBMISSION ===')
    
    try {
      const supabase = createBrowserClient()
      
      // 1. Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (process.env.NODE_ENV === 'development') console.log('User check:', { user, authError })
      
      if (authError || !user) {
        alert('Please log in to submit a quote request.')
        setIsSubmitting(false) // ✅ Fixed: Set isSubmitting to false before redirect
        window.location.href = '/login'
        return
      }

      // 2. Prepare data
      if (process.env.NODE_ENV === 'development') console.log('Step 2: Preparing data...')
      if (process.env.NODE_ENV === 'development') console.log('Form data:', formData)

      const insertData = {
        customer_id: user.id,
        space_type: formData.spaceType,
        project_types: formData.projectTypes,
        budget: formData.budget,
        timeline: formData.timeline,
        postal_code: formData.postalCode,
        full_address: formData.fullAddress,
        visit_date: formData.visitDate || null,
        description: formData.description,
        phone: formData.phone,
        photos: [],
        status: 'pending'
      }

      if (process.env.NODE_ENV === 'development') console.log('Insert data prepared:', insertData)
      if (process.env.NODE_ENV === 'development') console.log('Data types:', {
        customer_id: typeof insertData.customer_id,
        space_type: typeof insertData.space_type,
        project_types: Array.isArray(insertData.project_types),
        budget: typeof insertData.budget,
        timeline: typeof insertData.timeline,
        postal_code: typeof insertData.postal_code,
        full_address: typeof insertData.full_address,
        visit_date: insertData.visit_date,
        description: typeof insertData.description,
        phone: typeof insertData.phone,
        photos: Array.isArray(insertData.photos),
        status: typeof insertData.status
      })

      // 3. Insert into database
      if (process.env.NODE_ENV === 'development') console.log('Step 3: Inserting to database...')
      const { data: result, error: insertError } = await supabase
        .from('quote_requests')
        .insert(insertData)
        .select()
        .single()

      if (process.env.NODE_ENV === 'development') console.log('Insert result:', { result, insertError })

      if (insertError) {
        console.error('Insert failed:', insertError)
        toast.error(`Save failed: ${insertError.message}`)
        return // Will be caught by finally block
      }

      if (result) {
        if (process.env.NODE_ENV === 'development') console.log('SUCCESS! Quote saved:', result)
        toast.success('Quote request submitted successfully!')
        setIsCompleted(true)
      } else {
        console.error('No data returned after insert')
        toast.error('Saved but cannot verify data.')
      }
      
    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.error(`Unexpected error: ${error.message}`)
    } finally {
      // ✅ Fixed: Always set isSubmitting to false in finally block
      setIsSubmitting(false)
      if (process.env.NODE_ENV === 'development') console.log('=== SUBMISSION COMPLETE ===')
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // ✅ Step 5의 Next 버튼 활성화 여부를 체크하는 함수
  const isStep5Complete = (): boolean => {
    if (!formData.postalCode || !formData.fullAddress) {
      return false
    }
    const postalPattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/
    if (!postalPattern.test(formData.postalCode)) {
      return false
    }
    // ✅ 현장방문 날짜가 반드시 입력되어야 함
    if (!formData.visitDate || formData.visitDate.trim() === '') {
      return false
    }
    return true
  }

  const validateStep = (step: number): boolean => {
    switch(step) {
      case 1:
        if (!formData.spaceType) {
          alert('Please select a property type.')
          return false
        }
        break
      case 2:
        if (formData.projectTypes.length === 0) {
          alert('Please select at least one project area.')
          return false
        }
        break
      case 3:
        if (!formData.budget) {
          alert('Please select a budget range.')
          return false
        }
        break
      case 4:
        if (!formData.timeline) {
          alert('Please select a start time.')
          return false
        }
        break
      case 5:
        if (!formData.postalCode || !formData.fullAddress) {
          alert('Please enter both postal code and full address.')
          return false
        }
        const postalPattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/
        if (!postalPattern.test(formData.postalCode)) {
          alert('Please enter a valid postal code format. (e.g., A0A 0A0)')
          return false
        }
        // ✅ 현장방문 날짜 필수 검증 강화
        if (!formData.visitDate || formData.visitDate.trim() === '') {
          alert('⚠️ Site visit date is REQUIRED!\n\nContractors need to visit your site to provide accurate estimates. Please select a preferred date using the calendar.')
          return false
        }
        break
      case 6:
        if (!formData.description) {
          alert('Please enter a project description.')
          return false
        }
        if (!formData.phone || formData.phone.trim() === '') {
          alert('Please enter your phone number.')
          return false
        }
        break
    }
    return true
  }

  const handleSpaceTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, spaceType: value, projectTypes: [] }))
  }

  const handleProjectTypeChange = (value: string, isExclusive: boolean = false) => {
    setFormData(prev => {
      let newTypes = [...prev.projectTypes]
      
      if (isExclusive) {
        // When selecting exclusive option (full renovation or other)
        if (newTypes.includes(value)) {
          // Deselect if already selected
          newTypes = []
        } else {
          // Remove all other options and select only this one
          newTypes = [value]
        }
      } else {
        // When selecting regular option
        // First remove all exclusive options (full_renovation, other)
        newTypes = newTypes.filter(type => type !== 'full_renovation' && type !== 'other')
        
        // Toggle current option
        if (newTypes.includes(value)) {
          newTypes = newTypes.filter(type => type !== value)
        } else {
          newTypes.push(value)
        }
      }
      
      return { ...prev, projectTypes: newTypes }
    })
  }

  // Single selection handler for commercial type
  const handleCommercialProjectTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, projectTypes: [value] }))
  }

  const formatPostalCode = (value: string) => {
    // Extract only letters and numbers
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Format as Canadian postal code (A0A 0A0)
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Extract only numbers
    const cleaned = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10)
    
    // Format as Canadian phone number (123) 123-1234
    if (limited.length === 0) {
      return ''
    } else if (limited.length <= 3) {
      return `(${limited})`
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setFormData(prev => ({ ...prev, postalCode: formatted }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const previousValue = formData.phone
    const inputValue = input.value
    const cursorPosition = input.selectionStart || 0
    
    // Extract only numbers
    const cleaned = inputValue.replace(/\D/g, '')
    const previousCleaned = previousValue.replace(/\D/g, '')
    
    // Apply formatting
    const formatted = formatPhoneNumber(inputValue)
    
    // Calculate cursor position: based on number of digits before cursor
    const beforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length
    
    // Find same digit position in formatted string
    let newCursorPosition = formatted.length
    let count = 0
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        count++
        if (count === beforeCursor) {
          newCursorPosition = i + 1
          break
        }
      }
    }
    
    setFormData(prev => ({ ...prev, phone: formatted }))
    
    // Restore cursor position (after next render)
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  // 날짜 입력 핸들러 추가
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 유효한 날짜 형식인지 확인 (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    
    if (value === '' || datePattern.test(value)) {
      setFormData(prev => ({ ...prev, visitDate: value }))
    }
  }

  // 날짜 입력 필드에 키보드 입력 방지 (달력만 사용하도록)
  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 특정 키(Tab, Delete, Backspace, Arrow keys)만 허용
    const allowedKeys = ['Tab', 'Delete', 'Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault()
    }
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-emerald-500 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your quote request has been successfully submitted.<br />
            Contractors will visit after admin approval.
          </p>
          <button
            onClick={() => window.location.href = '/my-quotes'}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            View My Quotes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-emerald-500 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 sm:p-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Quote Request</h1>
            <p className="text-base sm:text-lg opacity-90">Complete in 6 simple steps</p>
            
            {/* Progress Bar */}
            <div className="bg-white bg-opacity-20 h-2 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            <p className="text-sm mt-2 opacity-80">Step {currentStep}/6</p>
          </div>

          <div className="p-4 sm:p-8">
            {/* Step 1: Space Type */}
            {currentStep === 1 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">1</span>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Property Type</h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 ml-11">Select the type of space you want to renovate</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {spaceTypes.map((type) => (
                    <label key={type.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="spaceType"
                        value={type.value}
                        checked={formData.spaceType === type.value}
                        onChange={() => handleSpaceTypeChange(type.value)}
                        className="sr-only"
                      />
                      <div className={`p-6 border-2 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 ${
                        formData.spaceType === type.value
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                      }`}>
                        <div className="text-lg sm:text-2xl font-semibold text-gray-900">{type.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Project Types */}
            {currentStep === 2 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">2</span>
                    <h2 className="text-2xl font-semibold text-gray-900">Project Area</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Select the area you want to renovate</p>
                </div>
                
                {formData.spaceType === 'commercial' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {commercialProjectTypes.map((type) => (
                      <label key={type.value} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="commercialProjectType"
                          value={type.value}
                          checked={formData.projectTypes.includes(type.value)}
                          onChange={() => handleCommercialProjectTypeChange(type.value)}
                          className="sr-only"
                        />
                        <div className={`p-6 border-2 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 ${
                          formData.projectTypes.includes(type.value)
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                            : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                        }`}>
                          <div className="text-lg font-semibold text-gray-900">{type.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="bg-emerald-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-emerald-800">
                        <strong>Note:</strong> If you select 'Full Renovation', you cannot select other options. You can select multiple options for the rest.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      {residentialProjectTypes.map((type) => (
                        <label key={type.value} className="relative cursor-pointer">
                          <input
                            type="checkbox"
                            name="projectTypes"
                            value={type.value}
                            checked={formData.projectTypes.includes(type.value)}
                            onChange={() => handleProjectTypeChange(type.value, type.exclusive || false)}
                            className="sr-only"
                          />
                          <div className={`p-6 border-2 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 ${
                            formData.projectTypes.includes(type.value)
                              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                              : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                          }`}>
                            <div className="text-lg font-semibold text-gray-900">{type.label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">3</span>
                    <h2 className="text-2xl font-semibold text-gray-900">Budget Range</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Select your estimated budget range</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {budgetRanges.map((budget) => (
                    <label key={budget.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="budget"
                        value={budget.value}
                        checked={formData.budget === budget.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`p-6 border-2 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 ${
                        formData.budget === budget.value
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                      }`}>
                        <div className="text-lg font-semibold text-gray-900 mb-1">{budget.label}</div>
                        <div className="text-sm text-gray-600">{budget.subtitle}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Timeline */}
            {currentStep === 4 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">4</span>
                    <h2 className="text-2xl font-semibold text-gray-900">Start Time</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Select your preferred project start time</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {timelines.map((timeline) => (
                    <label key={timeline.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="timeline"
                        value={timeline.value}
                        checked={formData.timeline === timeline.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`p-6 border-2 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 ${
                        formData.timeline === timeline.value
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                      }`}>
                        <div className="text-lg font-semibold text-gray-900 mb-1">{timeline.label}</div>
                        <div className="text-sm text-gray-600">{timeline.subtitle}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Location - 현장방문 필수로 강화 */}
            {currentStep === 5 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">5</span>
                    <h2 className="text-2xl font-semibold text-gray-900">Location & Site Visit</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Enter project location and required site visit schedule</p>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={handlePostalCodeChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="e.g. A0A 0A0"
                      maxLength={7}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                    <input
                      type="text"
                      value={formData.fullAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="e.g. 123 Main Street, Toronto, ON"
                    />
                  </div>
                  
                  {/* ✅ 현장방문 날짜 - 필수 강화 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Visit Date *
                    </label>
                    <input
                      ref={dateInputRef}
                      type="date"
                      required
                      value={formData.visitDate}
                      onChange={handleDateChange}
                      onKeyDown={handleDateKeyDown}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:border-transparent text-lg [&::-webkit-calendar-picker-indicator]:cursor-pointer transition-all ${
                        formData.visitDate 
                          ? 'border-gray-200 focus:ring-emerald-500 bg-white' 
                          : 'border-gray-200 focus:ring-indigo-500 bg-white'
                      }`}
                      style={{ 
                        colorScheme: 'light',
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                      }}
                    />
                    
                    {/* ✅ 선택 여부에 따른 메시지 */}
                    {formData.visitDate && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 mt-3">
                        <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          <span>Site visit scheduled for <strong>{new Date(formData.visitDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Why is this required?</strong> Contractors must physically inspect your property to understand the scope of work and provide you with the most accurate quote possible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Description */}
            {currentStep === 6 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">6</span>
                    <h2 className="text-2xl font-semibold text-gray-900">Project Requirements</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Write detailed requirements for your project</p>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg resize-vertical"
                      placeholder="Write detailed information about your project. e.g. desired style, special requirements, current condition, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="e.g. (416) 555-0100"
                    />
                    <p className="text-sm text-gray-600 mt-2">For contractors to contact you directly</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
                >
                  ← Previous
                </button>
              )}
              
              <div className="flex-1"></div>

              {currentStep < 6 ? (
                <>
                  {/* ✅ Step 5에서만 조건부 비활성화 */}
                  {currentStep === 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStep5Complete()}
                      className={`px-10 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        isStep5Complete()
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                      title={!isStep5Complete() ? 'Please complete all required fields including site visit date' : 'Continue to next step'}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-10 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
                    >
                      Next →
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => onSubmit(e)}
                  disabled={isSubmitting}
                  className={`px-10 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
