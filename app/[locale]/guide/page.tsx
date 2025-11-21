import Link from 'next/link'
import { ArrowLeft, BookOpen, UserPlus, FileText, Search, MessageSquare, CheckCircle, Star } from 'lucide-react'

export default function GuidePage() {
  const guides = [
    {
      title: 'Getting Started',
      icon: UserPlus,
      color: 'emerald',
      steps: [
        'Create your free account using email or Google',
        'Complete your profile with basic information',
        'Verify your email address',
        'Start exploring contractors and services'
      ]
    },
    {
      title: 'Requesting Quotes',
      icon: FileText,
      color: 'blue',
      steps: [
        'Click "Request a Quote" from the main menu',
        'Select your project type and provide details',
        'Upload relevant photos (optional but recommended)',
        'Set your budget range and preferred timeline',
        'Submit your request and wait for contractor responses'
      ]
    },
    {
      title: 'Finding Contractors',
      icon: Search,
      color: 'amber',
      steps: [
        'Browse the "Find Professionals" section',
        'Use filters to narrow down by location and specialty',
        'Review contractor profiles, ratings, and portfolios',
        'Check customer reviews and completed projects',
        'Save your favorite contractors for later'
      ]
    },
    {
      title: 'Reviewing Quotes',
      icon: MessageSquare,
      color: 'purple',
      steps: [
        'Access "My Quotes" from your dashboard',
        'Compare prices, timelines, and scope of work',
        'Message contractors to ask questions',
        'Request clarifications or modifications',
        'Select your preferred contractor'
      ]
    },
    {
      title: 'Managing Projects',
      icon: CheckCircle,
      color: 'green',
      steps: [
        'Track project status in your dashboard',
        'Communicate with your contractor through the platform',
        'Upload progress photos and documents',
        'Mark milestones as complete',
        'Release payments as work progresses'
      ]
    },
    {
      title: 'Leaving Reviews',
      icon: Star,
      color: 'orange',
      steps: [
        'Wait for project completion notification',
        'Click "Leave a Review" in your dashboard',
        'Rate the contractor on quality, communication, and value',
        'Write detailed feedback about your experience',
        'Submit your review to help other homeowners'
      ]
    }
  ]

  const tips = [
    {
      title: 'Be Detailed in Your Quote Requests',
      description: 'The more information you provide, the more accurate your quotes will be. Include dimensions, materials preferences, and any specific requirements.'
    },
    {
      title: 'Compare Multiple Quotes',
      description: 'Don\'t just go with the cheapest option. Consider the contractor\'s experience, reviews, and communication style.'
    },
    {
      title: 'Check Credentials',
      description: 'Verify that contractors have proper licenses, insurance, and certifications for your type of project.'
    },
    {
      title: 'Communicate Clearly',
      description: 'Keep all communication on the platform for your protection. Be responsive and clear about your expectations.'
    },
    {
      title: 'Document Everything',
      description: 'Take before and after photos, keep copies of agreements, and maintain a record of all communications.'
    },
    {
      title: 'Be Realistic with Timelines',
      description: 'Quality work takes time. Discuss realistic timelines with your contractor and build in some buffer time.'
    }
  ]

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
            <BookOpen className="h-12 w-12 mr-4" />
            <h1 className="text-5xl font-bold">User Guide</h1>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            Learn how to make the most of our platform and successfully complete your renovation projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Start Guide */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Step-by-Step Guides</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide, index) => {
              const Icon = guide.icon
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className={`h-12 w-12 bg-${guide.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 text-${guide.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{guide.title}</h3>
                  <ol className="space-y-2">
                    {guide.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-gray-600 flex items-start">
                        <span className="font-semibold text-gray-900 mr-2">{stepIndex + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tips & Best Practices */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Tips & Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="border-l-4 border-emerald-600 pl-4 py-2">
                <h3 className="font-bold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 text-sm">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Need More Help */}
        <div className="bg-gradient-to-r from-emerald-700 to-amber-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
          <p className="text-xl mb-8 text-white/90">
            Our support team is always ready to assist you with any questions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/faq"
              className="inline-block bg-white text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              View FAQ
            </Link>
            <Link
              href="/support"
              className="inline-block bg-amber-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-amber-600 transition-colors shadow-lg"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
