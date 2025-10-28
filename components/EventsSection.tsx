'use client'

import { Calendar, MapPin, Clock } from 'lucide-react'

export default function EventsSection() {
  const events = [
    {
      id: 1,
      title: 'Spring Home Show',
      date: 'March 15-17, 2024',
      time: '10:00 AM - 8:00 PM',
      location: 'Toronto Convention Centre',
    },
    {
      id: 2,
      title: 'Design Workshop',
      date: 'April 5, 2024',
      time: '2:00 PM - 5:00 PM',
      location: 'Design Studio Downtown',
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Join Our <span className="text-emerald-700">Exclusive</span> Events
          </h2>
          <div className="w-20 h-1 bg-emerald-700 mx-auto"></div>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
          {events.map((event) => (
            <div 
              key={event.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-emerald-100 to-emerald-300"></div>
              
              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-emerald-700" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3 text-emerald-700" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-emerald-700" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200">
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button className="border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white px-10 py-4 rounded-lg font-semibold transition-all duration-300">
            View All Events
          </button>
        </div>
      </div>
    </section>
  )
}
