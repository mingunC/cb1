import { Shield, CheckCircle, DollarSign, Award } from 'lucide-react'

export default function WhyChooseUsSection() {
  const benefits = [
    {
      icon: Shield,
      title: 'Verified Professionals',
      description: 'Every contractor is thoroughly vetted through license validation, insurance verification, and background checks.'
    },
    {
      icon: CheckCircle,
      title: 'Protected Against Fraud',
      description: 'Our secure bidding process eliminates the 8.87% deposit scam rate plaguing the renovation industry.'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'No surprise costs or hidden fees. Get honest quotes from multiple qualified contractors.'
    },
    {
      icon: Award,
      title: 'Quality First',
      description: 'We prioritize quality over lowest bid. Only reputable contractors can bid on your project.'
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f1e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-6">
            <div className="w-1.5 h-1.5 bg-[#2c5f4e] rounded-full"></div>
            <span className="text-xs text-gray-700 font-medium tracking-wide">Why Choose Us</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl lg:text-5xl mb-3 tracking-tight">
            <span className="font-serif text-gray-800">Your</span>{' '}
            <span className="font-serif text-[#2c5f4e] italic">Fortress</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 font-normal max-w-2xl mx-auto">
            토론토 주택 소유주들이 직면한 신뢰 위기를 해결합니다
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-100 hover:border-[#2c5f4e]/20"
              >
                {/* Icon Container */}
                <div className="mb-6">
                  <div className="w-14 h-14 bg-[#2c5f4e]/5 border-2 border-[#2c5f4e]/20 rounded-2xl flex items-center justify-center">
                    <Icon className="h-6 w-6 text-[#2c5f4e]" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
