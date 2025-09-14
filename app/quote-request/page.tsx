import QuoteRequestForm from '@/components/QuoteRequestForm'

export default function QuoteRequestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            무료 견적 요청
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            간단한 5단계로 완료되는 견적 요청입니다. 
            전문 업체들이 직접 연락드려 맞춤형 견적을 제공합니다.
          </p>
        </div>

        {/* 견적 요청 폼 */}
        <QuoteRequestForm />
      </div>
    </div>
  )
}
