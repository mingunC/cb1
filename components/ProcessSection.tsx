import { Users, ArrowRight, Wrench, CheckCircle } from 'lucide-react'

export default function ProcessSection() {
  const steps = [
    {
      number: '01',
      icon: <CheckCircle className="h-8 w-8 text-amber-600" />,
      title: 'Consultation',
      description: 'Your needs and vision are discussed'
    },
    {
      number: '02',
      icon: <Users className="h-8 w-8 text-amber-600" />,
      title: 'Expert Matching',
      description: 'We match you with the right professionals'
    },
    {
      number: '03',
      icon: <Wrench className="h-8 w-8 text-amber-600" />,
      title: 'Execution',
      description: 'Expert team brings your vision to life'
    },
    {
      number: '04',
      icon: <CheckCircle className="h-8 w-8 text-amber-600" />,
      title: 'Completion',
      description: 'Final review and handover of your space'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How We Simplify Your Renovation Experience
          </h2>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                
                {/* Step Number */}
                <div className="text-2xl font-bold text-amber-600 mb-2">{step.number}</div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
