import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, UserCheck } from 'lucide-react'

export default function PrivacyPage() {
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
            <ShieldCheck className="h-12 w-12 mr-4" />
            <h1 className="text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Last Updated */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <Lock className="h-4 w-4 mr-2" />
            Last updated: January 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-6 w-6 mr-2 text-emerald-600" />
                1. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you register on our platform, we collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name and contact information (email, phone number, address)</li>
                <li>Account credentials</li>
                <li>Profile information and photos</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 Project Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you use our services, we collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Project descriptions and specifications</li>
                <li>Photos and documents related to your projects</li>
                <li>Communication with contractors</li>
                <li>Reviews and ratings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 Usage Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Pages visited and features used</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-emerald-600" />
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide and improve our platform services</li>
                <li>Connect you with suitable contractors</li>
                <li>Process transactions and send notifications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send important updates about our services</li>
                <li>Prevent fraud and enhance security</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-6 w-6 mr-2 text-emerald-600" />
                3. Information Sharing
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information with:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Contractors</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you request a quote, we share relevant project information and your contact details with matching contractors.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We work with trusted third-party service providers who assist us with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Payment processing</li>
                <li>Cloud hosting and storage</li>
                <li>Email and communication services</li>
                <li>Analytics and performance monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed">
                We may disclose information when required by law or to protect our rights, safety, or property.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-emerald-600" />
                4. Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Restricted access to personal information</li>
                <li>Secure authentication processes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Control cookie preferences</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at admin@canadabeaver.pro
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Personalize content and advertisements</li>
                <li>Improve platform functionality</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings, but this may limit some platform features.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, and legitimate business purposes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our platform is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes through email or platform notifications. Continued use of our services after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
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
            href="/terms"
            className="inline-flex items-center px-6 py-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-gray-700 font-medium"
          >
            Terms of Service
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
