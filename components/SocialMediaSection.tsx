'use client'

import { Instagram } from 'lucide-react'

// Threads Icon Component
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 440 511.43"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="nonzero"
      d="M342.383 237.038a177.282 177.282 0 00-6.707-3.046c-3.948-72.737-43.692-114.379-110.429-114.805-38.505-.255-72.972 15.445-94.454 48.041l36.702 25.178c15.265-23.159 39.221-28.096 56.864-28.096.204 0 .408 0 .61.002 21.974.14 38.555 6.529 49.287 18.987 7.81 9.071 13.034 21.606 15.621 37.425-19.483-3.311-40.553-4.329-63.077-3.038-63.45 3.655-104.24 40.661-101.501 92.08 1.391 26.083 14.385 48.523 36.587 63.181 18.772 12.391 42.95 18.45 68.077 17.079 33.183-1.819 59.215-14.48 77.377-37.63 13.793-17.58 22.516-40.363 26.368-69.069 15.814 9.544 27.535 22.103 34.007 37.2 11.006 25.665 11.648 67.84-22.764 102.223-30.15 30.121-66.392 43.151-121.164 43.554-60.758-.45-106.708-19.935-136.583-57.915-27.976-35.562-42.434-86.93-42.973-152.674.539-65.746 14.997-117.114 42.973-152.676 29.875-37.979 75.824-57.463 136.582-57.914 61.197.455 107.948 20.033 138.967 58.195 15.21 18.713 26.676 42.248 34.236 69.688L440 161.532c-9.163-33.775-23.582-62.881-43.203-87.017C357.031 25.59 298.872.519 223.936 0h-.3C148.851.518 91.344 25.683 52.709 74.795 18.331 118.499.598 179.308.002 255.535l-.002.18.002.18c.596 76.225 18.329 137.037 52.707 180.741 38.635 49.11 96.142 74.277 170.927 74.794h.3c66.486-.462 113.352-17.868 151.96-56.442 50.51-50.463 48.99-113.718 32.342-152.549-11.945-27.847-34.716-50.463-65.855-65.401zM227.587 344.967c-27.808 1.567-56.699-10.916-58.124-37.651-1.056-19.823 14.108-41.942 59.831-44.577a266.87 266.87 0 0115.422-.45c16.609 0 32.145 1.613 46.271 4.701-5.268 65.798-36.172 76.483-63.4 77.977z"
    />
  </svg>
)

export default function SocialMediaSection() {
  // Renovation-related images
  const images = [
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&auto=format&fit=crop', // Modern kitchen
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop', // Living room
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&auto=format&fit=crop', // Bathroom
    'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&auto=format&fit=crop', // Kitchen renovation
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop', // Bedroom
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&auto=format&fit=crop', // Home office
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop', // Dining room
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&auto=format&fit=crop', // Modern interior
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&auto=format&fit=crop', // Bathroom design
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop', // Kitchen detail
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop', // Living space
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop'  // Bedroom renovation
  ]

  return (
    <section className="pt-12 pb-0 bg-white">
      {/* Header - Centered with max-width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              <span className="text-[#2c5f4e]">FOLLOW US</span>{' '}
              <span className="text-gray-900">ON SOCIAL MEDIA!</span>
            </h2>
            <p className="text-[#2c5f4e] text-lg">@canadabeaverservice</p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com/canadabeaverservice/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-[#2c5f4e] rounded-lg flex items-center justify-center transition-colors group"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors" />
            </a>
            <a
              href="https://www.threads.com/@canadabeaverservice"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-[#2c5f4e] rounded-lg flex items-center justify-center transition-colors group"
              aria-label="Threads"
            >
              <ThreadsIcon className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>
      </div>

      {/* Image Grid - Full width, no padding */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0">
        {images.map((image, index) => (
          <a
            key={index}
            href="https://www.instagram.com/canadabeaverservice/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden"
          >
            <img
              src={image}
              alt={`Renovation project ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <Instagram className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
