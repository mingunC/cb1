import Link from 'next/link'
import { ArrowLeft, Headphones, Clock, MessageCircle, Mail } from 'lucide-react'

export default function SupportPage() {
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
          <div className="flex items-center mb-6">
            <Headphones className="h-12 w-12 mr-4" />
            <h1 className="text-5xl font-bold">Customer Support</h1>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            We're here to help! Get assistance with your projects, account, or any questions you may have.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Support Options Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <Mail className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Email Support</h3>
            <p className="text-gray-600 mb-6">
              Send us an email and we'll respond within 24 hours.
            </p>
            <a
              href="mailto:admin@canadabeaver.pro"
              className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700"
            >
              admin@canadabeaver.pro
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Live Chat</h3>
            <p className="text-gray-600 mb-6">
              Chat with our support team in real-time for quick answers.
            </p>
            <button className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
              Start Chat (Coming Soon)
            </button>
          </div>
        </div>

        {/* Support Hours */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="flex items-center mb-6">
            <Clock className="h-8 w-8 text-emerald-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Support Hours</h2>
          </div>
          <div className="max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Email & Chat Support</h3>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Monday - Friday:</span> 9:00 AM - 6:00 PM EST</p>
              <p><span className="font-medium">Saturday:</span> 10:00 AM - 4:00 PM EST</p>
              <p><span className="font-medium">Sunday:</span> Closed</p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Common Support Topics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Account & Profile</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Password reset</li>
                <li>• Update profile information</li>
                <li>• Account verification</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Project Management</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Submit quote requests</li>
                <li>• Review quotes</li>
                <li>• Project status updates</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Contractor Services</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Finding contractors</li>
                <li>• Reading reviews</li>
                <li>• Communication issues</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Payments & Billing</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Payment methods</li>
                <li>• Invoice inquiries</li>
                <li>• Refund requests</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">More Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/faq"
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600 text-sm">Find answers to frequently asked questions</p>
            </Link>
            <Link
              href="/guide"
              className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">User Guide</h3>
              <p className="text-gray-600 text-sm">Learn how to use our platform effectively</p>
            </Link>
            <Link
              href="/contact"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">Contact Form</h3>
              <p className="text-gray-600 text-sm">Send us a detailed message</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
