import { MessageSquare, Users, Settings, CheckCircle } from 'lucide-react'

export default function ProcessSection() {
  const steps = [
    {
      number: '01',
      icon: <MessageSquare className="h-8 w-8 text-amber-600" />,
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
      icon: <Settings className="h-8 w-8 text-amber-600" />,
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
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            How We Simplify Your Renovation Experience
          </h2>
          <div className="w-24 h-1 bg-amber-600 mx-auto"></div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-amber-600/30 transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="text-6xl font-bold text-gray-100 group-hover:text-amber-600/20 transition-colors mb-4">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="bg-amber-600/10 rounded-xl p-4 group-hover:bg-amber-600 group-hover:scale-110 transition-all">
                    {step.icon}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 text-center leading-relaxed">
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
