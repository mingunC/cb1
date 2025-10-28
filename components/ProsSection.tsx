'use client'

import { Building2 } from 'lucide-react'
import Link from 'next/link'

export default function ProsSection() {
  // Partner logos or placeholders
  const partners = Array(8).fill(null).map((_, i) => i + 1)

  return (
    <section className="py-24 bg-gradient-to-b from-emerald-900 to-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Meet Our <span className="text-amber-500">200+</span> Partners
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mb-8"></div>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10">
            Trusted professionals across Canada ready to bring your vision to life
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/30"
            >
              <div className="text-white/60 flex flex-col items-center">
                <Building2 className="h-12 w-12 mb-2" />
                <span className="text-sm font-medium">Partner {partner}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/pros"
            className="inline-flex items-center border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-950 px-10 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg"
          >
            Explore All Professionals
          </Link>
        </div>
      </div>
    </section>
  )
}
