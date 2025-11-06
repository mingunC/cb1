import { Shield, CheckCircle, DollarSign, Star, Award, Lock } from 'lucide-react'
import Link from 'next/link'

export default function WhyChooseUsSection() {
  const benefits = [
    {
      icon: Shield,
      title: 'Verified & Trusted Professionals',
      description: 'Stop worrying about scams and fraud. Every contractor is thoroughly vetted through license validation, insurance verification, and background checks.',
      stat: '60%',
      statLabel: 'of homeowners struggle to find qualified contractors',
      color: 'emerald'
    },
    {
      icon: Lock,
      title: 'Protected Against Deposit Fraud',
      description: 'Your money is safe. Our secure bidding process and contractor verification eliminates the 8.87% deposit scam rate plaguing the industry.',
      stat: '8.87%',
      statLabel: 'of renovation projects end in deposit fraud',
      color: 'red'
    },
    {
      icon: DollarSign,
      title: 'Transparent & Fair Pricing',
      description: 'No more surprise costs or hidden fees. Our competitive bidding process ensures you get honest quotes from multiple qualified contractors.',
      stat: '33%',
      statLabel: 'experience unexpected additional costs',
      color: 'amber'
    },
    {
      icon: Award,
      title: 'Quality-First, Not Price-First',
      description: 'Unlike other platforms, we prioritize quality over the lowest bid. Our curation process ensures only reputable contractors can bid on your project.',
      stat: '70%',
      statLabel: 'face at least one serious problem',
      color: 'blue'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: {
        icon: 'text-emerald-600',
        bg: 'bg-emerald-50',
        stat: 'text-emerald-600',
        border: 'border-emerald-200'
      },
      red: {
        icon: 'text-red-600',
        bg: 'bg-red-50',
        stat: 'text-red-600',
        border: 'border-red-200'
      },
      amber: {
        icon: 'text-amber-600',
        bg: 'bg-amber-50',
        stat: 'text-amber-600',
        border: 'border-amber-200'
      },
      blue: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        stat: 'text-blue-600',
        border: 'border-blue-200'
      }
    }
    return colors[color as keyof typeof colors] || colors.emerald
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
              Why Canada Beaver
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Your <span className="text-emerald-700">Fortress</span> Against Renovation Nightmares
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Toronto homeowners face a crisis of trust. We're here to change that with verified professionals, 
            transparent pricing, and a quality-first approach.
          </p>
        </div>

        {/* Statistics Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 mb-12 text-white text-center shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Shield className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold">8.87%</div>
                <div className="text-sm text-white/90">of projects end in deposit fraud</div>
              </div>
            </div>
            <div className="hidden md:block h-12 w-px bg-white/30"></div>
            <div className="text-lg font-medium">
              <strong>We eliminate this risk</strong> with verified contractors
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            const colors = getColorClasses(benefit.color)
            
            return (
              <div 
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${colors.border} hover:scale-105`}
              >
                {/* Icon */}
                <div className={`${colors.bg} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className={`h-8 w-8 ${colors.icon}`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-6">
                  {benefit.description}
                </p>

                {/* Stat */}
                <div className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}>
                  <div className={`text-3xl font-bold ${colors.stat} mb-1`}>
                    {benefit.stat}
                  </div>
                  <div className="text-sm text-gray-600">
                    {benefit.statLabel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust Framework CTA */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-2xl p-8 md:p-12 text-white text-center shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <CheckCircle className="h-12 w-12" />
              </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Not Just a Platform. A Trust Framework.
            </h3>
            <p className="text-lg text-white/90 mb-8">
              We're not neutral—we're curated, verified, and enforce compliance. 
              Your safety is our primary product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pros"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Browse Verified Contractors
              </Link>
              <Link
                href="/quote-request"
                className="inline-flex items-center justify-center px-8 py-4 bg-amber-500 text-white rounded-lg font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg"
              >
                Start Your Safe Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
