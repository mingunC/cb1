import { FileText, Users, Settings, CheckCircle } from 'lucide-react'

export default function ProcessSection() {
  const steps = [
    {
      icon: <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-700" />,
      title: 'Consultation',
      description: 'Start your project with expert advice'
    },
    {
      icon: <Users className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-700" />,
      title: 'Expert Matching',
      description: 'Connect with verified professionals'
    },
    {
      icon: <Settings className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-700" />,
      title: 'Execution',
      description: 'Watch your vision come to life'
    },
    {
      icon: <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-700" />,
      title: 'Completion',
      description: 'Enjoy your transformed space'
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
            How We Simplify Your<br className="hidden sm:block"/>Renovation Experience
          </h2>
          <div className="w-20 h-1 bg-emerald-700 mx-auto"></div>
        </div>

        {/* Process Steps - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="bg-emerald-50 rounded-2xl p-4 sm:p-6 group-hover:bg-emerald-100 transition-colors">
                    {step.icon}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
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
