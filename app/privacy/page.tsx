import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, UserCheck, AlertTriangle, Cookie } from 'lucide-react'

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
            Your privacy is important to us. Learn how we collect, use, and protect your information in accordance with PIPEDA.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Important Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">PIPEDA Compliance</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                This Privacy Policy explains how Canada Beaver handles personal information in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and other applicable Canadian privacy laws.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Last Updated */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <Lock className="h-4 w-4 mr-2" />
            Last updated: January 21, 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Privacy Policy is provided by Canada Beaver ("Canada Beaver", "we", "us", "our") and applies to this website and any applications, features, and online services owned or operated by Canada Beaver (collectively, the "Platform"). This Privacy Policy explains how we collect, use, store, process, disclose, share, transfer, retain, dispose of, and otherwise handle ("Handle") personal information in Canada.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy is governed by and forms an integral part of our Terms of Service. We will only Handle your personal information in accordance with this Privacy Policy unless otherwise required by applicable law. <strong>If you do not agree to us Handling your personal information, you should not use the Platform.</strong>
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-6 w-6 mr-2 text-emerald-600" />
                1. Personal Information and Privacy Law
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In Canada, "personal information" is generally defined as information about an identifiable individual under the Personal Information Protection and Electronic Documents Act (PIPEDA) and other applicable privacy laws ("Privacy Law"). Privacy Law gives you rights regarding your personal information and requires us to tell you how we Handle it.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy does not apply to information that is not personal information as defined under Privacy Law, such as business contact information or anonymized data.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Minors</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Platform is not intended for children under 14 years of age. <strong>No one under the age of 14 may provide any personal information to us.</strong> We do not knowingly collect personal information from children under 14.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you are under 14, do not use the Platform, register an account, make any purchases, or provide any information including your name, address, telephone number, email address, or screen name. If we learn we have collected information from a child under 14, we will delete that information. If you believe we have information from a child under 14, please contact us at privacyofficer@canadabeaver.pro.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Your Consent</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We Handle your personal information with your consent or as permitted or required by Privacy Law. Your consent may be express or implied, depending on the circumstances and sensitivity of the information.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                In most cases, your consent is implied by the fact that you have provided information to use the Platform or where Handling is necessary for the provision of our services. For secondary purposes (e.g., marketing communications), we will ask for your express consent.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>By accessing the Platform or providing personal information, you consent to the Handling of your personal information as outlined in this Privacy Policy.</strong>
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Revoking Consent</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may revoke your consent to us Handling your personal information at any time by contacting us at privacyofficer@canadabeaver.pro. Subject to Privacy Law, we will honor such requests.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Please note:</strong> If you revoke consent for certain uses of your personal information, we may no longer be able to provide you with certain services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Collection of Personal Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect personal information directly from you, through your interactions with the Platform, and from other sources including payment processors, fraud detection partners, and third-party analytics tools. The types of personal information we may collect include:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Account and Profile Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name, address, email address, telephone number, and other contact details</li>
                <li>Government-issued identification (e.g., driver's license or passport) for identity verification</li>
                <li>Usernames, passwords, and account preferences</li>
                <li>Profile photos and biographical information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Business Information (Contractors)</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Business names, trade names, and business contact information</li>
                <li>Information about directors, officers, partners, and personnel</li>
                <li>Licenses, certifications, insurance, and qualifications</li>
                <li>Portfolio images, work samples, and project histories</li>
                <li>Publicly available background information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Financial Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Credit card and debit card information</li>
                <li>Bank account information for payments</li>
                <li>Billing address and transaction history</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4 Project and Service Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Project descriptions, specifications, and requirements</li>
                <li>Photos and documents related to your projects</li>
                <li>Communications with contractors</li>
                <li>Reviews, ratings, and feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.5 Technical and Usage Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>IP addresses and location data (if device settings allow)</li>
                <li>Device information (phone, tablet, computer)</li>
                <li>Browser type and settings</li>
                <li>Pages visited, features used, and interaction data</li>
                <li>Cookies and similar tracking technologies (see Section 6)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.6 Communications and Interactions</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Messages, emails, and communications with us and other users</li>
                <li>Call recordings for customer service (with notice)</li>
                <li>Survey responses and feedback</li>
                <li>Participation in forums or message boards</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Cookie className="h-6 w-6 mr-2 text-emerald-600" />
                6. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies, web beacons, pixels, and other tracking technologies ("Cookies") to enhance your experience, analyze usage, and provide targeted advertising. A Cookie is a small text file stored on your device.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Types of Cookies We Use:</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Necessary Cookies</h4>
                    <p className="text-sm text-gray-600">Essential for the Platform to function properly, including authentication, security, and basic navigation.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Preference Cookies</h4>
                    <p className="text-sm text-gray-600">Remember your settings and preferences, such as language and region.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600">Help us understand how visitors use the Platform through tools like Google Analytics. This includes tracking page views, user behavior, and performance metrics.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600">Track your activity to deliver personalized advertisements. We may work with third parties like Google Ads, Facebook, and others for targeted advertising.</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Managing Cookies:</strong> You can control Cookies through your browser settings. However, disabling Cookies may limit your ability to use certain Platform features. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>View what Cookies are stored and delete them individually</li>
                <li>Block third-party Cookies</li>
                <li>Block all Cookies from specific sites</li>
                <li>Block all Cookies</li>
                <li>Delete all Cookies when you close your browser</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-emerald-600" />
                7. How We Use Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We Handle your personal information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide and improve the Platform and our services</li>
                <li>Process transactions and manage accounts</li>
                <li>Verify identity and prevent fraud</li>
                <li>Match homeowners with suitable contractors</li>
                <li>Facilitate communication between users</li>
                <li>Send service notifications and updates</li>
                <li>Provide customer support</li>
                <li>Conduct research and analytics to improve services</li>
                <li>Send marketing and promotional communications (with consent)</li>
                <li>Personalize your experience and content</li>
                <li>Detect and prevent misuse, fraud, or illegal activities</li>
                <li>Conduct background checks on contractors (where applicable)</li>
                <li>Comply with legal obligations and protect our rights</li>
                <li>Enforce our Terms of Service</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-6 w-6 mr-2 text-emerald-600" />
                8. Sharing and Disclosure of Personal Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your personal information with third parties in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 With Your Consent</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you provide consent or instruct us to share your information.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Platform Users</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you submit a quote request, your project details and contact information are shared with matching contractors. Your public profile information is visible to other users.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.3 Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We work with third-party service providers who assist with payment processing, cloud hosting, email services, analytics, customer support, and marketing.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.4 Business Transfers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In connection with a merger, acquisition, sale of assets, or other corporate transaction, your information may be transferred to the acquiring entity.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.5 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When required by law, court order, subpoena, or to protect our rights, property, or safety or that of others.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.6 Fraud Prevention</h3>
              <p className="text-gray-700 leading-relaxed">
                To protect against fraud, we may share information with fraud detection services and other companies for security purposes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfer</h2>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Important:</strong> Personal information may be transferred to or Handled outside Canada in countries that may not provide the same level of protection as Canada.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Some of our service providers may be located in or have facilities in jurisdictions outside Canada, including the United States. When your information is Handled outside Canada, it may be subject to the laws of those jurisdictions, including lawful requirements to disclose information to government authorities. For example, if information is transferred to the United States, it may be subject to the USA PATRIOT Act.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-emerald-600" />
                10. Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Firewalls and secure servers</li>
                <li>Regular security audits and updates</li>
                <li>Restricted access to personal information on a need-to-know basis</li>
                <li>Secure authentication processes</li>
              </ul>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>HOWEVER, YOU ACKNOWLEDGE THAT NO ELECTRONIC TRANSMISSION IS 100% SECURE. CANADA BEAVER MAKES NO GUARANTEES REGARDING SECURITY AND ANY TRANSMISSION OF INFORMATION IS AT YOUR OWN RISK.</strong>
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>You can help protect your information by:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Using strong, unique passwords</li>
                <li>Not sharing your password with others</li>
                <li>Logging out after using shared devices</li>
                <li>Keeping your software and antivirus up to date</li>
                <li>Being cautious about phishing emails</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Active Accounts:</strong> While your account is active and for a reasonable period thereafter</li>
                <li><strong>Transactional Records:</strong> 7 years for tax and accounting purposes</li>
                <li><strong>Legal Requirements:</strong> As required by applicable laws and regulations</li>
                <li><strong>Dispute Resolution:</strong> Until any disputes or claims are resolved</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                After the retention period expires, we will securely delete or anonymize your personal information. Anonymized data may be retained indefinitely for analytics and business purposes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under Privacy Law, you have the following rights regarding your personal information:
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Access</h3>
                  <p className="text-sm text-gray-700">You have the right to request confirmation as to whether we Handle your personal information and to obtain a copy of that information.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Rectification</h3>
                  <p className="text-sm text-gray-700">You may request correction of inaccurate or incomplete personal information.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Erasure</h3>
                  <p className="text-sm text-gray-700">You may request deletion of your personal information, subject to legal and contractual obligations.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Object</h3>
                  <p className="text-sm text-gray-700">You may object to certain processing of your personal information, including for marketing purposes.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Data Portability</h3>
                  <p className="text-sm text-gray-700">You may request your personal information in a structured, commonly used format.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Withdraw Consent</h3>
                  <p className="text-sm text-gray-700">You may revoke your consent to processing at any time.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Complain</h3>
                  <p className="text-sm text-gray-700">You may file a complaint with the Privacy Commissioner of Canada if you believe your rights have been violated.</p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacyofficer@canadabeaver.pro. We may request verification of your identity before processing your request. We may charge a reasonable fee for access requests.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Third-Party Links and Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Platform may contain links to third-party websites, applications, and services. We are not responsible for the privacy practices of these third parties. You should review their privacy policies before providing any personal information.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CANADA BEAVER IS NOT RESPONSIBLE FOR HOW THIRD PARTIES HANDLE YOUR PERSONAL INFORMATION.</strong>
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Anonymized Data</h2>
              <p className="text-gray-700 leading-relaxed">
                We may anonymize your personal information so that it cannot reasonably be re-identified. <strong>YOU ACKNOWLEDGE AND AGREE THAT WE MAY USE SUCH ANONYMIZED DATA FOR ANY LEGITIMATE BUSINESS PURPOSE WITHOUT FURTHER NOTICE OR CONSENT.</strong>
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes through email or Platform notifications. The "Last updated" date at the top indicates when this Policy was last revised. Your continued use after changes constitutes acceptance of the updated Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy, wish to exercise your rights, or want to file a complaint:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 font-semibold mb-2">Canada Beaver - Privacy Officer</p>
                <p className="text-gray-600">Email: privacyofficer@canadabeaver.pro</p>
                <p className="text-gray-600">General Email: admin@canadabeaver.pro</p>
                <p className="text-gray-600 mt-2">Address: Across Canada</p>
              </div>

              <div className="mt-6 bg-blue-50 rounded-lg p-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Privacy Commissioner of Canada:</strong>
                </p>
                <p className="text-sm text-gray-600">If you are not satisfied with our response to your privacy concerns, you may contact:</p>
                <p className="text-sm text-gray-600 mt-2">Office of the Privacy Commissioner of Canada</p>
                <p className="text-sm text-gray-600">30 Victoria Street, Gatineau, Quebec K1A 1H3</p>
                <p className="text-sm text-gray-600">Toll-free: 1-800-282-1376</p>
                <p className="text-sm text-gray-600">Website: www.priv.gc.ca</p>
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