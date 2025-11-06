import { FileText, CheckCircle, Gavel, Mail, Wrench } from 'lucide-react'

export default function ServiceProcessSection() {
  const steps = [
    {
      number: '01',
      icon: FileText,
      title: 'Complete Quote Request',
      description: 'Fill out our simple 6-step quote request form with your project details'
    },
    {
      number: '02',
      icon: CheckCircle,
      title: 'Admin Approval & Site Visit',
      description: 'After approval, contractors visit your site on your preferred date'
    },
    {
      number: '03',
      icon: Gavel,
      title: 'Bidding Begins',
      description: 'Verified contractors start preparing detailed quotes for your project'
    },
    {
      number: '04',
      icon: Mail,
      title: 'Receive Quotes',
      description: 'Get multiple professional quotes within 7 days'
    },
    {
      number: '05',
      icon: Wrench,
      title: 'Start Your Project',
      description: 'Choose your contractor and begin your renovation with confidence'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            The Service Process
          </h2>
          <div className="w-20 h-1 bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A simple, transparent process designed to connect you with the right professionals
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connecting Line - Desktop only */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent" 
               style={{ top: '80px' }}></div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              
              return (
                <div 
                  key={index}
                  className="relative text-center group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white border-4 border-blue-100 rounded-full flex items-center justify-center z-10">
                    <span className="text-blue-600 font-bold text-sm">{step.number}</span>
                  </div>

                  {/* Icon Container */}
                  <div className="pt-12 mb-4">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center transform rotate-45 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mx-auto">
                        <Icon className="h-9 w-9 text-white transform -rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 px-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed px-2">
                    {step.description}
                  </p>

                  {/* Arrow - Desktop only */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-20 -right-4 text-blue-300">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-blue-50 rounded-2xl px-8 py-6 border border-blue-100">
            <p className="text-gray-700 mb-4 text-lg">
              Ready to start your renovation journey?
            </p>
            <a
              href="/quote-request"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Request a Quote Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
