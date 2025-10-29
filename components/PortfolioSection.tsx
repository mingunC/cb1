'use client'

import { Folder, ArrowRight } from 'lucide-react'

export default function PortfolioSection() {
  const portfolios = Array(4).fill(null).map((_, i) => ({
    id: i + 1,
    image: `/placeholder-portfolio-${i + 1}.jpg`,
  }))

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          {/* Portfolio Badge - oval shaped with subtle shadow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f1e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-6">
            <Folder className="h-3.5 w-3.5 text-gray-700" />
            <span className="text-xs text-gray-700 font-medium">Portfolio</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl lg:text-5xl mb-3 tracking-tight">
            <span className="font-serif text-gray-800">Inspiring</span>{' '}
            <span className="font-serif text-[#2c5f4e] italic">Transformations</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 font-normal">
            완성된 프로젝트들을 통해 가능성을 확인하세요
          </p>
        </div>

        {/* Portfolio Grid - 3 images in first row, 1 in second row */}
        <div className="mb-12">
          {/* First Row - 3 images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {portfolios.slice(0, 3).map((portfolio) => (
              <div
                key={portfolio.id}
                className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-300"
              >
                {/* Placeholder image with interior design style */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2c5f4e] via-[#1a4d3e] to-[#0f3d2f]">
                  {/* Simulated interior design elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-b from-transparent via-black/20 to-black/40">
                      {/* Sofa representation */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#f5f1e8] to-[#e8e0d3]"></div>
                    </div>
                  </div>
                </div>
                {/* You can replace the above with actual images when available */}
              </div>
            ))}
          </div>

          {/* Second Row - 1 image left-aligned */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-300">
              {/* Placeholder image */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2c5f4e] via-[#1a4d3e] to-[#0f3d2f]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-b from-transparent via-black/20 to-black/40">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#f5f1e8] to-[#e8e0d3]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 border border-[#2c5f4e] bg-white text-[#2c5f4e] hover:bg-[#2c5f4e] hover:text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300">
            View Complete Gallery
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
