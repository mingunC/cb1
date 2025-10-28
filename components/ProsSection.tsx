'use client'

import { useState } from 'react'
import { Star, MapPin, Award, CheckCircle, X, Globe, Briefcase } from 'lucide-react'

interface Pro {
  id: number
  name: string
  contact: string
  rating: number
  reviewCount: number
  location: string
  specialties: string[]
  experience: string
  verified: boolean
  featured: boolean
  avatar: string
  address?: string
  website?: string
  description?: string
}

export default function ProsSection() {
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null)

  const pros: Pro[] = [
    {
      id: 1,
      name: '김리노베이션',
      contact: '김대표',
      rating: 4.9,
      reviewCount: 127,
      location: '서울 강남구',
      specialties: ['주방', '욕실', '전체'],
      experience: '15년',
      verified: true,
      featured: true,
      avatar: 'K',
      address: 'North York, ON',
      website: 'https://example.com',
      description: '고객 만족을 최우선으로 하는 전문 리노베이션 업체입니다.'
    },
    {
      id: 2,
      name: '퍼펙트홈',
      contact: '박대표',
      rating: 4.8,
      reviewCount: 89,
      location: '서울 서초구',
      specialties: ['욕실', '지하실'],
      experience: '12년',
      verified: true,
      featured: true,
      avatar: 'P',
      address: 'Toronto, ON',
      website: 'https://perfecthome.com',
      description: '완벽한 공간을 만들어드립니다.'
    },
    {
      id: 3,
      name: '스마트리노',
      contact: '이대표',
      rating: 4.7,
      reviewCount: 156,
      location: '서울 송파구',
      specialties: ['주방', '전체'],
      experience: '18년',
      verified: true,
      featured: false,
      avatar: 'S',
      address: 'Markham, ON',
      website: 'https://smartreno.com',
      description: '스마트한 리노베이션 솔루션을 제공합니다.'
    }
  ]

  return (
    <>
      <section className="py-24 bg-gradient-to-b from-emerald-950 to-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Meet Our Elite Partners
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto mb-6"></div>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Trusted professionals ready to transform your space
            </p>
            <div className="mt-10 flex justify-center">
              <button className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-950 px-10 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg">
                Explore All Professionals
              </button>
            </div>
          </div>

          {/* 업체 카드들 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {pros.map((pro) => (
              <div key={pro.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                {/* 업체 헤더 */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{pro.avatar}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{pro.name}</h3>
                        <p className="text-sm text-gray-600">{pro.contact}</p>
                      </div>
                    </div>
                    
                    {/* 인증 배지 */}
                    {pro.verified && (
                      <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">인증</span>
                      </div>
                    )}
                  </div>

                  {/* 평점과 리뷰 */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < Math.floor(pro.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{pro.rating}</span>
                    <span className="text-sm text-gray-500">({pro.reviewCount} 리뷰)</span>
                  </div>

                  {/* 위치 */}
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {pro.location}
                  </div>
                </div>

                {/* 업체 정보 */}
                <div className="p-6">
                  {/* 경력 */}
                  <div className="flex items-center mb-4">
                    <Award className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">{pro.experience} 경력</span>
                  </div>

                  {/* 전문 분야 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">전문 분야</h4>
                    <div className="flex flex-wrap gap-2">
                      {pro.specialties.map((specialty, index) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA 버튼 */}
                  <button 
                    onClick={() => setSelectedPro(pro)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    프로필 보기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 더 보기 버튼 */}
          <div className="text-center">
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-xl text-lg font-semibold transition-colors duration-200">
              모든 업체 보기
            </button>
          </div>
        </div>
      </section>

      {/* 프로필 상세 모달 */}
      {selectedPro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPro(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{selectedPro.avatar}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPro.name}</h2>
                  <p className="text-gray-600">{selectedPro.contact}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPro(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 평점 */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${
                          i < Math.floor(selectedPro.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{selectedPro.rating}</span>
                  <span className="text-gray-500">({selectedPro.reviewCount} 리뷰)</span>
                </div>
                {selectedPro.verified && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">인증된 업체</span>
                  </div>
                )}
              </div>

              {/* 회사 소개 */}
              {selectedPro.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">회사 소개</h3>
                  <p className="text-gray-600">{selectedPro.description}</p>
                </div>
              )}

              {/* 주소, 웹사이트, 경력 */}
              <div className="border-t border-b border-gray-200 py-4 space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">주소</p>
                    <p className="font-medium">{selectedPro.address || selectedPro.location}</p>
                  </div>
                </div>

                {selectedPro.website && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">웹사이트</p>
                      <a 
                        href={selectedPro.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {selectedPro.website}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-gray-700">
                  <Briefcase className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">경력 (년)</p>
                    <p className="font-medium">{selectedPro.experience}</p>
                  </div>
                </div>
              </div>

              {/* 전문 분야 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">전문 분야</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPro.specialties.map((specialty, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA 버튼 */}
              <div className="pt-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors duration-200">
                  견적 요청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
