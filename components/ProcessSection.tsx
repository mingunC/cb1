import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ProcessSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-emerald-700/30 text gutter-300 rounded-full text-sm font-medium">
              Verified Professionals
            </span>
          </div>

          {/* Main Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-100 mb-4 sm:mb-6">
            Meet Our{' '}
            <span className="text-amber-400 font-bold">Elite</span> Partners
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            Work with the best professionals carefully selected through our rigorous standards
          </p>

          {/* Additional Text */}
          <p className="text-sm text-gray-400 mb-8">
            More options coming soon
          </p>

          {/* CTA Button */}
          <Link
            href="/pros"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
          >
            Explore All Professionals
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}