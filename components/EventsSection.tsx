'use client'

import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function EventsSection() {
  const event = {
    title: 'melody',
    subtitle: 'melody',
    date: 'July 1, 2020',
    location: ''
  }

  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Upcoming Events Tag */}
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium">
              Upcoming Events
            </span>
          </div>

          {/* Main Title */}
          <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4 tracking-tight">
            Join Our <span className="text-emerald-800 italic font-normal">Exclusive</span> Events
          </h2>

          {/* Subtitle */}
          <p className="text-base text-gray-500 max-w-3xl mx-auto">
            Join special events with industry experts
          </p>
        </div>

        {/* Event Card */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            {/* Invited Tag */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                invited
              </span>
            </div>

            {/* Event Title */}
            <h3 className="text-2xl font-semibold text-gray-900 mb-2 mt-8">
              {event.title}
            </h3>

            {/* Event Subtitle */}
            <p className="text-gray-400 text-sm mb-4">
              {event.subtitle}
            </p>

            {/* Separator */}
            <div className="h-px bg-gray-200 my-6"></div>

            {/* Date */}
            <div className="flex items-center text-gray-400 text-sm mb-3">
              <Calendar className="h-4 w-4 mr-2 text-amber-600" />
              <span>{event.date}</span>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-400 text-sm mb-6">
              <MapPin className="h-4 w-4 mr-2 text-amber-600" />
              <span>{event.location || ''}</span>
            </div>

            {/* Learn More Link */}
            <Link href="/events" className="flex items-center text-gray-400 text-sm hover:text-gray-600 transition-colors">
              Learn More
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* View All Events Button */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-flex items-center border-2 border-emerald-700 text-emerald-700 bg-transparent hover:bg-emerald-700 hover:text-white px-10 py-3 rounded-full font-semibold transition-all duration-300"
          >
            View All Events
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}