import Link from 'next/link'
import { ArrowLeft, Target, Users, Award, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-amber-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-6">About Us</h1>
          <p className="text-xl text-white/90 max-w-3xl">
            Connecting homeowners with trusted renovation professionals across Canada
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex items-center mb-6">
            <Target className="h-8 w-8 text-emerald-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            At Renovation Platform, we believe that every home improvement project deserves the right professional. Our mission is to simplify the process of finding, comparing, and hiring qualified contractors who can transform your vision into reality.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We're committed to building trust between homeowners and professionals through transparency, verified reviews, and seamless communication.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <Users className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
            <p className="text-gray-600">
              We foster a community where homeowners and professionals can connect, collaborate, and create amazing spaces together.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <Award className="h-12 w-12 text-amber-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assurance</h3>
            <p className="text-gray-600">
              Every professional on our platform is verified and reviewed to ensure you receive the highest quality service for your project.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <Heart className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Trust & Transparency</h3>
            <p className="text-gray-600">
              We believe in honest communication, clear pricing, and transparent processes to build lasting trust with our users.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Founded in 2025, Renovation Platform was born from a simple observation: finding the right contractor for a home renovation project was unnecessarily complicated and stressful.
            </p>
            <p>
              Our founders, who had their own frustrating experiences with home improvements, saw an opportunity to create a platform that would bridge the gap between homeowners and qualified professionals.
            </p>
            <p>
              Today, we're proud to serve communities across Canada, helping thousands of homeowners bring their renovation dreams to life while supporting local contractors in growing their businesses.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-700 to-amber-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Project?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of satisfied homeowners who found their perfect contractor through our platform.
          </p>
          <Link
            href="/quote-request"
            className="inline-block bg-white text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Your Free Quote
          </Link>
        </div>
      </div>
    </div>
  )
}
