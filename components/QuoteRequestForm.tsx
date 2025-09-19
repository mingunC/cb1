'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'

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
  { value: 'detached_house', label: 'Detached House', subtitle: '단독주택' },
  { value: 'town_house', label: 'Town House', subtitle: '타운하우스' },
  { value: 'condo', label: 'Condo & Apartment', subtitle: '콘도 & 아파트' },
  { value: 'commercial', label: 'Commercial', subtitle: '상업공간' }
]

const residentialProjectTypes = [
  { value: 'kitchen', label: '주방' },
  { value: 'bathroom', label: '욕실' },
  { value: 'basement', label: '지하실' },
  { value: 'flooring', label: '바닥재' },
  { value: 'painting', label: '페인팅' },
  { value: 'full_renovation', label: '전체 리노베이션', exclusive: true },
  { value: 'other', label: '기타' }
]

const commercialProjectTypes = [
  { value: 'office', label: '사무실' },
  { value: 'retail', label: '상가/매장' },
  { value: 'restaurant', label: '카페/식당' },
  { value: 'education', label: '학원/교육' },
  { value: 'hospitality', label: '숙박/병원' },
  { value: 'other', label: '기타' }
]

const budgetRanges = [
  { value: 'under_50k', label: '$50,000 미만', subtitle: '소규모 리노베이션' },
  { value: '50k_100k', label: '$50,000 - $100,000', subtitle: '중규모 리노베이션' },
  { value: 'over_100k', label: '$100,000 이상', subtitle: '대규모 리노베이션' }
]

const timelines = [
  { value: 'immediate', label: '즉시 시작', subtitle: '가능한 빨리' },
  { value: '1_month', label: '1개월 내', subtitle: '한 달 이내' },
  { value: '3_months', label: '3개월 내', subtitle: '3개월 이내' },
  { value: 'planning', label: '계획 단계', subtitle: '아직 계획 중' }
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
        alert(`저장 실패: ${insertError.message}\n\n${JSON.stringify(insertError, null, 2)}`)
        return
      }

      if (result) {
        console.log('SUCCESS! Quote saved:', result)
        alert('견적 요청이 성공적으로 저장되었습니다!')
        setIsCompleted(true)
      } else {
        console.error('No data returned after insert')
        alert('저장은 되었으나 데이터를 확인할 수 없습니다.')
      }
      
    } catch (error: any) {
      console.error('Unexpected error:', error)
      alert(`예기치 않은 오류: ${error.message}`)
    } finally {
      setIsSubmitting(false)
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
        // 전체 리노베이션 선택 시 다른 옵션 모두 제거
        newTypes = [value]
      } else {
        // 일반 옵션 선택 시 전체 리노베이션 제거하고 현재 옵션 토글
        newTypes = newTypes.filter(type => type !== 'full_renovation')
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
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-purple-500 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">견적 요청 완료!</h2>
          <p className="text-gray-600 mb-6">
            견적 요청이 성공적으로 제출되었습니다.<br />
            관리자 승인 후 업체들이 견적을 제출할 예정입니다.
          </p>
          <button
            onClick={() => window.location.href = '/my-quotes'}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
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
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-purple-500 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">리노베이션 견적 요청</h1>
            <p className="text-lg opacity-90">간단한 6단계로 전문가의 견적을 받아보세요</p>
            
            {/* Progress Bar */}
            <div className="bg-white bg-opacity-20 h-2 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            <p className="text-sm mt-2 opacity-80">단계 {currentStep}/6</p>
          </div>

          <div className="p-8">
            {/* Step 1: Space Type */}
            {currentStep === 1 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-center leading-8 font-bold mr-3">1</span>
                    <h2 className="text-2xl font-semibold text-gray-900">부동산 유형</h2>
                  </div>
                  <p className="text-gray-600 ml-11">리노베이션하실 공간의 유형을 선택해주세요</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
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
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}>
                        <div className="text-lg font-semibold text-gray-900 mb-1">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.subtitle}</div>
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
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-center leading-8 font-bold mr-3">2</span>
                    <h2 className="text-2xl font-semibold text-gray-900">프로젝트 영역</h2>
                  </div>
                  <p className="text-gray-600 ml-11">리노베이션하실 영역을 선택해주세요</p>
                </div>
                
                {formData.spaceType === 'commercial' ? (
                  <div className="grid grid-cols-2 gap-4 mb-8">
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
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                            : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                        }`}>
                          <div className="text-lg font-semibold text-gray-900">{type.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>참고:</strong> '전체 리노베이션'을 선택하면 다른 옵션은 선택할 수 없습니다. 나머지는 다중 선택이 가능합니다.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {residentialProjectTypes.map((type) => (
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
                              ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                              : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                          } ${type.exclusive && formData.projectTypes.includes('full_renovation') && !formData.projectTypes.includes(type.value) ? 'opacity-50' : ''}`}>
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
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-center leading-8 font-bold mr-3">3</span>
                    <h2 className="text-2xl font-semibold text-gray-900">예산 범위</h2>
                  </div>
                  <p className="text-gray-600 ml-11">예상 예산 범위를 선택해주세요</p>
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
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
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
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-center leading-8 font-bold mr-3">4</span>
                    <h2 className="text-2xl font-semibold text-gray-900">시작 시기</h2>
                  </div>
                  <p className="text-gray-600 ml-11">프로젝트 시작 희망 시기를 선택해주세요</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
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
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
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
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-center leading-8 font-bold mr-3">5</span>
                    <h2 className="text-2xl font-semibold text-gray-900">위치 정보</h2>
                  </div>
                  <p className="text-gray-600 ml-11">프로젝트 위치와 방문 일정을 입력해주세요</p>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={handlePostalCodeChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="예: A0A 0A0"
                      maxLength={7}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상세 주소 *</label>
                    <input
                      type="text"
                      value={formData.fullAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="예: 123 Main Street, Toronto, ON"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">방문 희망 일자</label>
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg cursor-pointer"
                    />
                    <p className="text-sm text-gray-600 mt-2">현장 방문을 원하시는 날짜를 선택해주세요</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Description */}
            {currentStep === 6 && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-center leading-8 font-bold mr-3">6</span>
                    <h2 className="text-2xl font-semibold text-gray-900">프로젝트 요구사항</h2>
                  </div>
                  <p className="text-gray-600 ml-11">프로젝트에 대한 상세 요구사항을 작성해주세요</p>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">프로젝트 설명 *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg resize-vertical"
                      placeholder="프로젝트에 대한 자세한 설명을 작성해주세요. 예: 원하는 스타일, 특별한 요구사항, 현재 상태 등"
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
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
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