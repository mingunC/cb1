'use client'

import { Sofa } from 'lucide-react'
import { useState } from 'react'

export default function PortfolioSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const portfolios = Array(4).fill(null).map((_, i) => ({
    id: i + 1,
    title: `Project ${i + 1}`,
  }))

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Inspiring <span className="text-emerald-700">Transformations</span>
          </h2>
          <div className="w-20 h-1 bg-emerald-700 mx-auto"></div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {portfolios.map((portfolio, index) => (
            <div 
              key={portfolio.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Image Container */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-300 flex items-center justify-center">
                <Sofa className="h-20 w-20 text-emerald-700" />
              </div>
              
              {/* Overlay */}
              <div 
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                  hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {portfolio.title}
                  </h3>
                  <p className="text-white/90 text-sm">
                    Beautiful transformation
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button className="border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white px-10 py-4 rounded-lg font-semibold transition-all duration-300">
            View All Portfolio
          </button>
        </div>
      </div>
    </section>
  )
}
