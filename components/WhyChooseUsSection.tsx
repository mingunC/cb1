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
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Us
          </h2>
          <div className="w-20 h-1 bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Toronto homeowners face a crisis of trust in renovation services. We're here to change that 
            with verified professionals, transparent pricing, and a quality-first approach.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            
            return (
              <div 
                key={index}
                className="text-center group hover:transform hover:scale-105 transition-all duration-300"
              >
                {/* Hexagon-style Icon Container */}
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center transform rotate-45 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Icon className="h-10 w-10 text-white transform -rotate-45" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
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
