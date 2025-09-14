import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: '프로젝트 세부사항',
      description: '공간 유형과 원하는 작업을 선택하세요',
      details: ['단독주택/타운하우스/아파트', '주방/욕실/지하실/전체/기타']
    },
    {
      number: '02',
      title: '예산 설정',
      description: '예상 예산 범위를 알려주세요',
      details: ['50만원 미만', '50만원-100만원', '100만원 이상']
    },
    {
      number: '03',
      title: '일정 계획',
      description: '원하는 시작 시기를 선택하세요',
      details: ['즉시 시작', '1개월 내', '3개월 내', '계획 단계']
    },
    {
      number: '04',
      title: '위치 정보',
      description: '프로젝트 위치와 방문 희망일을 입력하세요',
      details: ['우편번호', '상세 주소', '방문 희망일']
    },
    {
      number: '05',
      title: '추가 세부사항',
      description: '프로젝트에 대한 설명과 사진을 첨부하세요',
      details: ['상세 설명', '참고 사진 업로드', '특별 요청사항']
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            간단한 5단계로 시작하세요
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            복잡한 견적 요청 과정을 간소화했습니다. 
            몇 분만 투자하면 전문 업체들이 직접 연락드립니다.
          </p>
        </div>

        {/* 프로세스 스텝들 */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* 연결선 (마지막 스텝 제외) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-8 top-16 w-0.5 h-24 bg-gradient-to-b from-blue-200 to-blue-100"></div>
              )}

              <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
                {/* 스텝 번호와 아이콘 */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    {/* 체크 아이콘 (완료 상태 시뮬레이션) */}
                    <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* 스텝 내용 */}
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-sm text-gray-500">
                          <div className="h-1.5 w-1.5 bg-blue-400 rounded-full mr-3"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 화살표 (데스크톱에서만) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex items-center">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              준비되셨나요?
            </h3>
            <p className="text-gray-600 mb-6">
              지금 바로 견적을 요청하고 전문 업체들의 제안을 받아보세요
            </p>
            <Link
              href="/quote-request"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-colors duration-200 inline-block"
            >
              견적 요청 시작하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
