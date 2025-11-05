import Link from 'next/link'
import { ArrowLeft, FileText, Scale, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
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
            <Scale className="h-12 w-12 mr-4" />
            <h1 className="text-5xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            Please read these terms carefully before using our platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Last Updated */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <FileText className="h-4 w-4 mr-2" />
            Last updated: January 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Renovation Platform ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Platform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Eligibility</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be at least 18 years old and capable of entering into legally binding contracts to use our services.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Account Registration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Prohibited Activities</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Posting false or misleading information</li>
                <li>Impersonating another person or entity</li>
                <li>Engaging in fraudulent activities</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Interfering with the proper functioning of the Platform</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Content</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of any content you submit to the Platform, including project descriptions, reviews, and photos. However, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with operating and promoting the Platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You are solely responsible for the content you post and must ensure it does not violate any third-party rights or applicable laws.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Contractor Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Renovation Platform acts as a marketplace connecting homeowners with contractors. We do not directly provide renovation services and are not a party to any agreements between homeowners and contractors.
              </p>
              <p className="text-gray-700 leading-relaxed">
                While we verify contractors on our platform, we do not guarantee the quality of their work. Users are encouraged to conduct their own due diligence when selecting a contractor.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment and Fees</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All payment transactions between homeowners and contractors are handled directly between the parties. Renovation Platform may charge service fees as outlined in our pricing structure, which will be clearly communicated before any transaction.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, Renovation Platform and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your use of the Platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after changes are posted constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account and access to the Platform at any time, with or without cause, and with or without notice.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Canada, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mt-4">
                <p className="text-gray-700 font-semibold mb-2">Renovation Platform</p>
                <p className="text-gray-600">Email: admin@canadabeaver.pro</p>
                <p className="text-gray-600">Phone: 1-800-RENOVATE</p>
              </div>
            </section>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/privacy"
            className="inline-flex items-center px-6 py-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-gray-700 font-medium"
          >
            <ShieldCheck className="h-5 w-5 mr-2 text-emerald-600" />
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-colors font-medium"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
