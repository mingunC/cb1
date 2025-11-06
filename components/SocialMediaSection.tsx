'use client'

import { Instagram, Youtube } from 'lucide-react'

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
  const images = [
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1615529162924-f8605388461d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop'
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-[#2c5f4e]">FOLLOW US</span>{' '}
              <span className="text-gray-900">ON SOCIAL MEDIA!</span>
            </h2>
            <p className="text-[#2c5f4e] text-lg">@canadabeaverservice</p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.youtube.com/@canadabeaverservice"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-[#2c5f4e] rounded-lg flex items-center justify-center transition-colors group"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors" />
            </a>
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

        {/* Image Grid - Desktop: 6 columns, Mobile: 2 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {images.map((image, index) => (
            <a
              key={index}
              href="https://www.instagram.com/canadabeaverservice/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={image}
                alt={`Social media post ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
            </a>
          ))}
        </div>

        {/* Follow Button */}
        <div className="text-center mt-12">
          <a
            href="https://www.instagram.com/canadabeaverservice/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#2c5f4e] text-white rounded-lg font-semibold hover:bg-[#234a3d] transition-colors shadow-lg"
          >
            <Instagram className="h-5 w-5" />
            Follow Us on Instagram
          </a>
        </div>
      </div>
    </section>
  )
}
