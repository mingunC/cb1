import QuoteRequestForm from '@/components/QuoteRequestForm'

export default function QuoteRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 페이지 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Request a Free Quote
          </h1>
          <div className="w-20 h-1 bg-amber-600 mx-auto mb-4"></div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Complete in 5 simple steps. 
            Professional partners will contact you directly to provide a customized quote.
          </p>
        </div>

        {/* 견적 요청 폼 */}
        <QuoteRequestForm />
      </div>
    </div>
  )
}
