import Link from 'next/link'
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react'

export default function FAQPage() {
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click on the "Login" button in the top right corner. You can register using your email address or sign in with your Google account. Fill in your basic information, and you\'ll be ready to start requesting quotes!'
        },
        {
          q: 'Is the platform free to use?',
          a: 'Yes! Creating an account and requesting quotes from contractors is completely free for homeowners.'
        },
        {
          q: 'What areas do you serve?',
          a: 'We plan to launch our service in Ontario first and gradually expand to other regions.'
        }
      ]
    },
    {
      category: 'Quote Requests',
      questions: [
        {
          q: 'How do I request a quote?',
          a: 'Navigate to the "Request a Quote" page, and complete the quote request form in 6 simple steps. After you submit the request, our administrator will review and approve it. Once our partner contractors complete the necessary site visits, you will start receiving their quotes.'
        },
        {
          q: 'How many quotes will I receive?',
          a: 'Typically, you\'ll receive 1-5 quotes from qualified contractors in your area. The exact number may vary depending on the type of project and contractor availability.'
        },
        {
          q: 'How long does it take to get quotes?',
          a: 'You will receive quotes from the partner contractors who completed a site visit for up to 7 days after the site visit is finished. Complex projects may take slightly longer as contractors need time to properly assess the requirements.'
        },
        {
          q: 'Can I edit my quote request after submitting?',
          a: 'Yes! You can edit your project details from your dashboard before contractors submit their quotes. Once a contractor has submitted a quote, you\'ll need to contact them directly for any changes.'
        }
      ]
    },
    {
      category: 'Working with Contractors',
      questions: [
        {
          q: 'How are contractors verified?',
          a: 'All contractors on our platform undergo a verification process that includes license validation, insurance confirmation, and background checks. We also review their work history and customer feedback.'
        },
        {
          q: 'How do I choose the right contractor?',
          a: 'Review each contractor\'s profile, including their ratings, reviews, portfolio, and specialties. Compare their quotes, timeline estimates, and communication style. Don\'t hesitate to ask questions before making your decision.'
        },
        {
          q: 'What if I\'m not satisfied with the quotes I receive?',
          a: 'You\'re never obligated to accept any quote. You can request additional information from contractors, ask for revised quotes, or submit a new quote request with modified requirements.'
        },
        {
          q: 'How do I communicate with contractors?',
          a: 'Once you receive quotes, you can message contractors directly through our platform. All communication is tracked and saved for your reference.'
        }
      ]
    },
    {
      category: 'Payments & Pricing',
      questions: [
        {
          q: 'When do I pay?',
          a: 'Payment terms are agreed upon directly between you and the contractor. Typically, contractors may require a deposit before starting work, with the balance due upon completion. Always get payment terms in writing.'
        },
        {
          q: 'What payment methods are accepted?',
          a: 'Payment methods vary by contractor but commonly include bank transfer, check, credit card, or financing options. Discuss payment preferences with your chosen contractor.'
        },
        {
          q: 'Are there any hidden fees?',
          a: 'No hidden fees! Contractors provide all-inclusive quotes that detail the costs. Our platform service fee is clearly disclosed before you confirm any booking.'
        }
      ]
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the login page, enter your email address, and you\'ll receive instructions to reset your password. If you don\'t receive the email, check your spam folder or contact support.'
        },
        {
          q: 'Is my personal information secure?',
          a: 'Yes! We use industry-standard encryption and security measures to protect your data. We never share your personal information without your consent. Read our Privacy Policy for more details.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can request account deletion from your account settings. Please note that this action is permanent and will remove all your project history and data.'
        }
      ]
    },
    {
      category: 'Reviews & Ratings',
      questions: [
        {
          q: 'How do I leave a review?',
          a: 'After your project is completed, you\'ll receive a notification to review your contractor. You can rate their work, professionalism, and communication, and leave detailed feedback to help other homeowners.'
        },
        {
          q: 'Can contractors see my review before I submit it?',
          a: 'No, your review is private until you submit it. Once submitted, it becomes visible on the contractor\'s profile and cannot be edited (but can be deleted within 48 hours).'
        },
        {
          q: 'What if I have a dispute with a contractor?',
          a: 'Contact our support team immediately. We\'ll help mediate the situation and work toward a resolution. We take disputes seriously and review both sides before taking action.'
        }
      ]
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
            <HelpCircle className="h-12 w-12 mr-4" />
            <h1 className="text-5xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            Find answers to common questions about using our platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-amber-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">{category.category}</h2>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {category.questions.map((faq, faqIndex) => (
                    <div key={faqIndex} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      <details className="group">
                        <summary className="flex justify-between items-start cursor-pointer list-none">
                          <h3 className="text-lg font-semibold text-gray-900 pr-8">
                            {faq.q}
                          </h3>
                          <ChevronDown className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0 mt-1" />
                        </summary>
                        <p className="mt-4 text-gray-600 leading-relaxed">
                          {faq.a}
                        </p>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 bg-gradient-to-r from-emerald-700 to-amber-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl mb-8 text-white/90">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/support"
              className="inline-block bg-white text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Contact Support
            </Link>
            <Link
              href="/contact"
              className="inline-block bg-amber-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-amber-600 transition-colors shadow-lg"
            >
              Send a Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
