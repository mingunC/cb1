'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
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

export default function QuoteRequestForm() {
  const t = useTranslations()
  const locale = useLocale()
  
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

  const spaceTypes = [
    { value: 'detached_house', label: t('spaceTypes.detachedHouse') },
    { value: 'town_house', label: t('spaceTypes.townHouse') },
    { value: 'condo', label: t('spaceTypes.condoApartment') },
    { value: 'commercial', label: t('spaceTypes.commercial') }
  ]

  const residentialProjectTypes = [
    { value: 'kitchen', label: t('projectTypes.kitchen') },
    { value: 'bathroom', label: t('projectTypes.bathroom') },
    { value: 'basement', label: t('projectTypes.basement') },
    { value: 'flooring', label: t('projectTypes.flooring') },
    { value: 'painting', label: t('projectTypes.painting') },
    { value: 'full_renovation', label: t('projectTypes.fullRenovation'), exclusive: true },
    { value: 'other', label: t('projectTypes.other'), exclusive: true }
  ]

  const commercialProjectTypes = [
    { value: 'office', label: t('projectTypes.office') },
    { value: 'retail', label: t('projectTypes.retail') },
    { value: 'restaurant', label: t('projectTypes.restaurant') },
    { value: 'education', label: t('projectTypes.education') },
    { value: 'hospitality', label: t('projectTypes.hospitality') },
    { value: 'other', label: t('projectTypes.other') }
  ]

  const budgetRanges = [
    { value: 'under_50k', label: t('budget.under50k'), subtitle: t('budget.under50kSubtitle') },
    { value: '50k_100k', label: t('budget.50kTo100k'), subtitle: t('budget.50kTo100kSubtitle') },
    { value: 'over_100k', label: t('budget.over100k'), subtitle: t('budget.over100kSubtitle') }
  ]

  const timelines = [
    { value: 'immediate', label: t('timeline.immediate'), subtitle: t('timeline.immediateSubtitle') },
    { value: '1_month', label: t('timeline.1month'), subtitle: t('timeline.1monthSubtitle') },
    { value: '3_months', label: t('timeline.3months'), subtitle: t('timeline.3monthSubtitle') },
    { value: 'planning', label: t('timeline.planning'), subtitle: t('timeline.planningSubtitle') }
  ]

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (isSubmitting) {
      if (process.env.NODE_ENV === 'development') console.log('Already submitting, ignoring duplicate call')
      return
    }
    
    setIsSubmitting(true)
    if (process.env.NODE_ENV === 'development') console.log('=== STARTING QUOTE SUBMISSION ===')
    
    try {
      const supabase = createBrowserClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (process.env.NODE_ENV === 'development') console.log('User check:', { user, authError })
      
      if (authError || !user) {
        alert(t('quoteRequest.validation.loginRequired'))
        setIsSubmitting(false)
        window.location.href = `/${locale}/login`
        return
      }

      if (process.env.NODE_ENV === 'development') console.log('Step 2: Updating user preferred_locale...')
      // 사용자의 preferred_locale 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ preferred_locale: locale })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update preferred_locale:', updateError)
        // 에러가 발생해도 계속 진행 (치명적이지 않음)
      } else {
        if (process.env.NODE_ENV === 'development') console.log('✅ User preferred_locale updated:', locale)
      }

      if (process.env.NODE_ENV === 'development') console.log('Step 3: Preparing quote data...')
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

      if (process.env.NODE_ENV === 'development') console.log('Step 4: Inserting to database...')
      const { data: result, error: insertError } = await supabase
        .from('quote_requests')
        .insert(insertData)
        .select()
        .single()

      if (process.env.NODE_ENV === 'development') console.log('Insert result:', { result, insertError })

      if (insertError) {
        console.error('Insert failed:', insertError)
        toast.error(`Save failed: ${insertError.message}`)
        return
      }

      if (result) {
        if (process.env.NODE_ENV === 'development') console.log('SUCCESS! Quote saved:', result)
        toast.success(t('common.success'))
        setIsCompleted(true)
      } else {
        console.error('No data returned after insert')
        toast.error('Saved but cannot verify data.')
      }
      
    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.error(`Unexpected error: ${error.message}`)
    } finally {
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

  const isStep5Complete = (): boolean => {
    if (!formData.postalCode || !formData.fullAddress) {
      return false
    }
    const postalPattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/
    if (!postalPattern.test(formData.postalCode)) {
      return false
    }
    if (!formData.visitDate || formData.visitDate.trim() === '') {
      return false
    }
    return true
  }

  const validateStep = (step: number): boolean => {
    switch(step) {
      case 1:
        if (!formData.spaceType) {
          alert(t('quoteRequest.validation.selectSpaceType'))
          return false
        }
        break
      case 2:
        if (formData.projectTypes.length === 0) {
          alert(t('quoteRequest.validation.selectProjectType'))
          return false
        }
        break
      case 3:
        if (!formData.budget) {
          alert(t('quoteRequest.validation.selectBudget'))
          return false
        }
        break
      case 4:
        if (!formData.timeline) {
          alert(t('quoteRequest.validation.selectTimeline'))
          return false
        }
        break
      case 5:
        if (!formData.postalCode || !formData.fullAddress) {
          alert(t('quoteRequest.validation.enterPostalAndAddress'))
          return false
        }
        const postalPattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/
        if (!postalPattern.test(formData.postalCode)) {
          alert(t('quoteRequest.validation.invalidPostalCode'))
          return false
        }
        if (!formData.visitDate || formData.visitDate.trim() === '') {
          alert(t('quoteRequest.siteVisitRequired'))
          return false
        }
        break
      case 6:
        if (!formData.description) {
          alert(t('quoteRequest.validation.enterDescription'))
          return false
        }
        if (!formData.phone || formData.phone.trim() === '') {
          alert(t('quoteRequest.validation.enterPhoneNumber'))
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
        if (newTypes.includes(value)) {
          newTypes = []
        } else {
          newTypes = [value]
        }
      } else {
        newTypes = newTypes.filter(type => type !== 'full_renovation' && type !== 'other')
        
        if (newTypes.includes(value)) {
          newTypes = newTypes.filter(type => type !== value)
        } else {
          newTypes.push(value)
        }
      }
      
      return { ...prev, projectTypes: newTypes }
    })
  }

  const handleCommercialProjectTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, projectTypes: [value] }))
  }

  const formatPostalCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
    }
  }

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
    
    const cleaned = inputValue.replace(/\D/g, '')
    const previousCleaned = previousValue.replace(/\D/g, '')
    
    const formatted = formatPhoneNumber(inputValue)
    
    const beforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length
    
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
    
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    
    if (value === '' || datePattern.test(value)) {
      setFormData(prev => ({ ...prev, visitDate: value }))
    }
  }

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('quoteRequest.completedTitle')}</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">
            {t('quoteRequest.completedMessage')}
          </p>
          <button
            onClick={() => window.location.href = `/${locale}/my-quotes`}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            {t('quoteRequest.viewMyQuotes')}
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('quoteRequest.title')}</h1>
            <p className="text-base sm:text-lg opacity-90">{t('quoteRequest.subtitle')}</p>
            
            {/* Progress Bar */}
            <div className="bg-white bg-opacity-20 h-2 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            <p className="text-sm mt-2 opacity-80">{t('quoteRequest.step')} {currentStep}{t('quoteRequest.of')}6</p>
          </div>

          <div className="p-4 sm:p-8">
            {/* Step 1: Space Type */}
            {currentStep === 1 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">1</span>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('quoteRequest.step1.title')}</h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 ml-11">{t('quoteRequest.step1.subtitle')}</p>
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
                    <h2 className="text-2xl font-semibold text-gray-900">{t('quoteRequest.step2.title')}</h2>
                  </div>
                  <p className="text-gray-600 ml-11">{t('quoteRequest.step2.subtitle')}</p>
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
                        <strong>{t('quoteRequest.step2.note').split(':')[0]}:</strong> {t('quoteRequest.step2.note').split(':')[1]}
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
                    <h2 className="text-2xl font-semibold text-gray-900">{t('quoteRequest.step3.title')}</h2>
                  </div>
                  <p className="text-gray-600 ml-11">{t('quoteRequest.step3.subtitle')}</p>
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
                    <h2 className="text-2xl font-semibold text-gray-900">{t('quoteRequest.step4.title')}</h2>
                  </div>
                  <p className="text-gray-600 ml-11">{t('quoteRequest.step4.subtitle')}</p>
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

            {/* Step 5: Location */}
            {currentStep === 5 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">5</span>
                    <h2 className="text-2xl font-semibold text-gray-900">{t('quoteRequest.step5.title')}</h2>
                  </div>
                  <p className="text-gray-600 ml-11">{t('quoteRequest.step5.subtitle')}</p>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('quoteRequest.postalCode')}</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={handlePostalCodeChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder={t('quoteRequest.postalCodePlaceholder')}
                      maxLength={7}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('quoteRequest.fullAddress')}</label>
                    <input
                      type="text"
                      value={formData.fullAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder={t('quoteRequest.fullAddressPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('quoteRequest.siteVisitDate')}
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
                    
                    {formData.visitDate && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 mt-3">
                        <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          <span>{t('quoteRequest.siteVisitScheduled')} <strong>{new Date(formData.visitDate).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-blue-800">
                        {t('quoteRequest.siteVisitWhy')}
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
                    <h2 className="text-2xl font-semibold text-gray-900">{t('quoteRequest.step6.title')}</h2>
                  </div>
                  <p className="text-gray-600 ml-11">{t('quoteRequest.step6.subtitle')}</p>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('quoteRequest.projectDescription')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg resize-vertical"
                      placeholder={t('quoteRequest.projectDescriptionPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('quoteRequest.phoneNumber')}</label>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder={t('quoteRequest.phoneNumberPlaceholder')}
                    />
                    <p className="text-sm text-gray-600 mt-2">{t('quoteRequest.phoneNumberNote')}</p>
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
                  ← {t('common.previous')}
                </button>
              )}
              
              <div className="flex-1"></div>

              {currentStep < 6 ? (
                <>
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
                      title={!isStep5Complete() ? t('quoteRequest.siteVisitRequired') : t('common.next')}
                    >
                      {t('common.next')} →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-10 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
                    >
                      {t('common.next')} →
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
                  {isSubmitting ? t('common.submitting') : t('quoteRequest.submitButton')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
