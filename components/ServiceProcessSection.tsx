'use client'

import { ClipboardList, CheckCircle, Calendar, Mail, Hammer } from 'lucide-react'
import Link from 'next/link'

export default function ServiceProcessSection() {
  const steps = [
    {
      number: '01',
      icon: ClipboardList,
      title: 'Complete Quote Request',
      description: 'Fill out our simple 6-step form with your project details and requirements'
    },
    {
      number: '02',
      icon: CheckCircle,
      title: 'Admin Approval',
      description: 'Our team reviews and approves your request, ensuring quality matches'
    },
    {
      number: '03',
      icon: Calendar,
      title: 'Site Visit Scheduled',
      description: 'Contractors visit your site on your preferred date for assessment'
    },
    {
      number: '04',
      icon: Mail,
      title: 'Receive Multiple Quotes',
      description: 'Get detailed professional quotes within 7 days after site visits'
    },
    {
      number: '05',
      icon: Hammer,
      title: 'Begin Your Project',
      description: 'Choose your preferred contractor and start your transformation'
    }
  ]

  return (
    <section className="py-24 bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Process Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f1e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-6">
            <div className="w-1.5 h-1.5 bg-[#2c5f4e] rounded-full"></div>
            <span className="text-xs text-gray-700 font-medium tracking-wide">Our Process</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl lg:text-5xl mb-3 tracking-tight">
            <span className="font-serif text-gray-800">The Service</span>{' '}
            <span className="font-serif text-[#2c5f4e] italic">Process</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 font-normal">
            Connect with top professionals through a simple and transparent process
          </p>
        </div>

        {/* Process Timeline */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1
            
            return (
              <div key={index} className="relative">
                {/* Connecting Line */}
                {!isLast && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-[#2c5f4e]/20 to-transparent hidden md:block" 
                       style={{ height: 'calc(100% + 2rem)' }}></div>
                )}

                <div className="flex flex-col md:flex-row gap-6 mb-12 last:mb-0 group">
                  {/* Icon Section */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {/* Number Badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#2c5f4e] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10">
                        {step.number}
                      </div>
                      
                      {/* Icon Container */}
                      <div className="w-14 h-14 bg-white border-2 border-[#2c5f4e]/20 rounded-2xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] group-hover:shadow-[0_4px_12px_rgba(44,95,78,0.15)] group-hover:border-[#2c5f4e] transition-all duration-300">
                        <Icon className="h-6 w-6 text-[#2c5f4e]" />
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-16">
          <Link
            href="/quote-request"
            className="inline-flex items-center gap-2 border border-[#2c5f4e] bg-white text-[#2c5f4e] hover:bg-[#2c5f4e] hover:text-white px-8 py-3 rounded-lg font-medium text-sm transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          >
            Start Your Renovation Journey
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
