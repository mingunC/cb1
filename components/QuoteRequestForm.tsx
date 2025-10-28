'use client'

import { useState, useEffect } from 'react'
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
  const [formData, setFormData] = useState<QuoteFormData>({
    spaceType: '',
    projectTypes: [],
    budget: '',
    timeline: '',
    postalCode: '',
    fullAddress: '',
    visitDate: '',
    description: ''
  })

  const onSubmit = async (e?: React.FormEvent) => {
    // 폼 제출 시 기본 동작 방지
    if (e) {
      e.preventDefault()
    }
    
    // 이미 제출 중이면 중복 실행 방지
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate call')
      return
    }
    
    setIsSubmitting(true)
    console.log('=== STARTING QUOTE SUBMISSION ===')
    
    try {
      const supabase = createBrowserClient()
      
      // 1. 사용자 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('User check:', { user, authError })
      
      if (authError || !user) {
        alert('로그인이 필요합니다.')
        window.location.href = '/login'
        return
      }

      // 2. 데이터 준비 (quote_requests 테이블 스키마에 맞춤)
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
        photos: [],  // 일단 빈 배열로
        status: 'pending'
      }
      
      console.log('Insert data prepared:', JSON.stringify(insertData, null, 2))

      // 3. 직접 삽입 시도
      const { data: result, error: insertError } = await supabase
        .from('quote_requests')
        .insert(insertData)
        .select()
        .single()

      console.log('Insert result:', { result, insertError })

      if (insertError) {
        console.error('Insert failed:', insertError)
        toast.error(`저장 실패: ${insertError.message}`)
        setIsSubmitting(false)
        return
      }

      if (result) {
        console.log('SUCCESS! Quote saved:', result)
        toast.success('견적 요청이 성공적으로 저장되었습니다!')
        setIsCompleted(true)
        setIsSubmitting(false)
      } else {
        console.error('No data returned after insert')
        toast.error('저장은 되었으나 데이터를 확인할 수 없습니다.')
        setIsSubmitting(false)
      }
      
    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.error(`예기치 않은 오류: ${error.message}`)
      setIsSubmitting(false)
    } finally {
      console.log('=== SUBMISSION COMPLETE ===')
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

  const validateStep = (step: number): boolean => {
    switch(step) {
      case 1:
        if (!formData.spaceType) {
          alert('부동산 유형을 선택해주세요.')
          return false
        }
        break
      case 2:
        if (formData.projectTypes.length === 0) {
          alert('프로젝트 영역을 선택해주세요.')
          return false
        }
        break
      case 3:
        if (!formData.budget) {
          alert('예산 범위를 선택해주세요.')
          return false
        }
        break
      case 4:
        if (!formData.timeline) {
          alert('시작 시기를 선택해주세요.')
          return false
        }
        break
      case 5:
        if (!formData.postalCode || !formData.fullAddress) {
          alert('Postal Code와 주소를 모두 입력해주세요.')
          return false
        }
        const postalPattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/
        if (!postalPattern.test(formData.postalCode)) {
          alert('올바른 Postal Code 형식을 입력해주세요. (예: A0A 0A0)')
          return false
        }
        break
      case 6:
        if (!formData.description) {
          alert('프로젝트 설명을 입력해주세요.')
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
        // 배타적 옵션 선택 시 (전체 리노베이션 또는 기타)
        if (newTypes.includes(value)) {
          // 이미 선택되어 있으면 해제
          newTypes = []
        } else {
          // 새로 선택하면 다른 모든 옵션 제거하고 현재 옵션만 선택
          newTypes = [value]
        }
      } else {
        // 일반 옵션 선택 시
        // 먼저 모든 배타적 옵션들 제거 (full_renovation, other)
        newTypes = newTypes.filter(type => type !== 'full_renovation' && type !== 'other')
        
        // 현재 옵션 토글
        if (newTypes.includes(value)) {
          newTypes = newTypes.filter(type => type !== value)
        } else {
          newTypes.push(value)
        }
      }
      
      return { ...prev, projectTypes: newTypes }
    })
  }


  const formatPostalCode = (value: string) => {
    // 영문자와 숫자만 추출
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // 캐나다 Postal Code 형식으로 포맷팅 (A0A 0A0)
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
    }
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setFormData(prev => ({ ...prev, postalCode: formatted }))
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-emerald-500 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">견적 요청 완료!</h2>
          <p className="text-gray-600 mb-6">
            견적 요청이 성공적으로 제출되었습니다.<br />
            관리자 승인 후 업체들이 방문 할 예정입니다.
          </p>
          <button
            onClick={() => window.location.href = '/my-quotes'}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            내 견적 보기
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
                          type="checkbox"
                          name="projectTypes"
                          value={type.value}
                          checked={formData.projectTypes.includes(type.value)}
                          onChange={() => handleProjectTypeChange(type.value, false)}
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

            {/* Step 5: Location */}
            {currentStep === 5 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-center leading-8 font-bold mr-3">5</span>
                    <h2 className="text-2xl font-semibold text-gray-900">Location & Visit</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Enter project location and visit schedule</p>
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Visit Date</label>
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg cursor-pointer"
                    />
                    <p className="text-sm text-gray-600 mt-2">Companies will visit to provide accurate estimates</p>
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
                  
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:transform hover:-translate-y-1'
                }`}
              >
                ← 이전
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  다음 →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => onSubmit(e)}
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:-translate-y-1 hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? '제출 중...' : '견적 요청하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
