'use client'

import { Calendar, MapPin, ArrowRight, Percent, Gift, Tag } from 'lucide-react'
import Link from 'next/link'

export default function EventsSection() {
  const events = [
    {
      id: 1,
      title: 'Winter Kitchen Renovation Sale',
      subtitle: 'Up to 30% off on complete kitchen makeovers',
      date: 'Nov 15 - Dec 31, 2025',
      location: 'Toronto & GTA',
      tag: 'Hot Deal',
      tagColor: 'bg-red-500 text-white',
      discount: '30%',
      icon: Percent
    },
    {
      id: 2,
      title: 'Bathroom Renovation Package',
      subtitle: 'Free fixture upgrade with any bathroom renovation',
      date: 'Nov 10 - Nov 30, 2025',
      location: 'Vancouver & Area',
      tag: 'Limited Offer',
      tagColor: 'bg-emerald-500 text-white',
      gift: 'Free Upgrade',
      icon: Gift
    },
    {
      id: 3,
      title: 'Home Office Design Workshop',
      subtitle: 'Free consultation with award-winning designers',
      date: 'December 5, 2025',
      location: 'Online Event',
      tag: 'Free Event',
      tagColor: 'bg-blue-500 text-white',
      icon: Tag
    }
  ]

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
            Don't miss out on special offers and expert-led workshops
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event) => {
            const IconComponent = event.icon
            return (
              <div 
                key={event.id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 relative group hover:scale-105"
              >
                {/* Tag */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 ${event.tagColor} rounded-full text-xs font-medium shadow-md`}>
                    {event.tag}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-xl flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>

                {/* Discount Badge */}
                {event.discount && (
                  <div className="mb-3">
                    <span className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-2xl">
                      {event.discount} OFF
                    </span>
                  </div>
                )}

                {/* Gift Badge */}
                {event.gift && (
                  <div className="mb-3">
                    <span className="inline-block bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold">
                      🎁 {event.gift}
                    </span>
                  </div>
                )}

                {/* Event Title */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>

                {/* Event Subtitle */}
                <p className="text-gray-600 text-sm mb-4 min-h-[40px]">
                  {event.subtitle}
                </p>

                {/* Separator */}
                <div className="h-px bg-gray-200 my-6"></div>

                {/* Date */}
                <div className="flex items-center text-gray-600 text-sm mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                  <span>{event.date}</span>
                </div>

                {/* Location */}
                <div className="flex items-center text-gray-600 text-sm mb-6">
                  <MapPin className="h-4 w-4 mr-2 text-amber-600" />
                  <span>{event.location}</span>
                </div>

                {/* Learn More Link */}
                <Link 
                  href="/events" 
                  className="flex items-center text-emerald-700 text-sm font-semibold hover:text-emerald-800 transition-colors group-hover:gap-2 gap-1"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 transition-all" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* View All Events Button */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-flex items-center border-2 border-emerald-700 text-emerald-700 bg-transparent hover:bg-emerald-700 hover:text-white px-10 py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-lg"
          >
            View All Events
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
