'use client'

import { Folder, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PortfolioSection() {
  // Fake portfolio projects with realistic data
  const portfolios = [
    {
      id: 1,
      title: 'Modern Kitchen Renovation',
      type: 'Kitchen',
      image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&auto=format&fit=crop',
      description: 'Contemporary kitchen with marble countertops'
    },
    {
      id: 2,
      title: 'Luxury Living Room',
      type: 'Living Room',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop',
      description: 'Elegant living space with modern furnishings'
    },
    {
      id: 3,
      title: 'Master Bathroom Suite',
      type: 'Bathroom',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&auto=format&fit=crop',
      description: 'Spa-like bathroom with premium fixtures'
    },
    {
      id: 4,
      title: 'Contemporary Office Space',
      type: 'Office',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
      description: 'Professional workspace with natural light'
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
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
                className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer"
              >
                {/* Portfolio Image */}
                <img 
                  src={portfolio.image} 
                  alt={portfolio.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block px-3 py-1 bg-[#2c5f4e] text-white text-xs rounded-full mb-2">
                      {portfolio.type}
                    </span>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {portfolio.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {portfolio.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row - 1 image left-aligned */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer">
              {/* Portfolio Image */}
              <img 
                src={portfolios[3].image} 
                alt={portfolios[3].title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay with gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block px-3 py-1 bg-[#2c5f4e] text-white text-xs rounded-full mb-2">
                    {portfolios[3].type}
                  </span>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {portfolios[3].title}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {portfolios[3].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Button - Now links to portfolio page */}
        <div className="text-center">
          <Link 
            href="/portfolio"
            className="inline-flex items-center gap-2 border border-[#2c5f4e] bg-white text-[#2c5f4e] hover:bg-[#2c5f4e] hover:text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300"
          >
            View Complete Gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
