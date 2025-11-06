import Link from 'next/link'
import { ArrowLeft, FileText, Scale, ShieldCheck, AlertTriangle } from 'lucide-react'

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
        {/* Important Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-2">IMPORTANT LEGAL NOTICE</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                THESE TERMS OF SERVICE CONSTITUTE A BINDING LEGAL AGREEMENT BETWEEN YOU AND CANADA BEAVER. BY ACCESSING OR USING THIS PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, YOU MUST NOT USE THE PLATFORM.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Last Updated */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <FileText className="h-4 w-4 mr-2" />
            Last updated: January 21, 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This website and any related applications, features, and online services (the "Platform") is owned and operated by Canada Beaver ("Canada Beaver", "we", "us", "our"). The Platform and all content are made available to you ("you", "your") subject to your compliance with these Terms of Service ("Terms") and our Privacy Policy.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>THESE TERMS CONSTITUTE A BINDING LEGAL AGREEMENT.</strong> By accessing or using the Platform, you represent and warrant that you have read, understood, and agree to be bound by these Terms. Canada Beaver reserves the right to modify these Terms at any time. Your continued use after modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                For information about how Canada Beaver collects, uses, handles, and shares your personal information in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA), please review our Privacy Policy, which forms an integral part of these Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility and Account Registration</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be at least 18 years old and capable of entering into legally binding contracts to use our services. No one under the age of 14 may provide any personal information to us or use the Platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Content and Platform Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Platform contains content provided by Canada Beaver and third parties, including editorial content, information, graphics, and other materials ("Content"). <strong>YOU ACKNOWLEDGE AND AGREE THAT THE PLATFORM AND CONTENT ARE PROVIDED FOR INFORMATIONAL PURPOSES ONLY.</strong> Neither the Platform nor any Content should be relied upon as accurate, complete, current, or fit for any particular purpose without independent verification.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The Content may no longer be accurate as a result of the passage of time. No one should act, or refrain from acting, solely on the basis of the Platform or Content.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Your Content and License</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Your Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may share, upload, post, or provide content to the Platform ("Your Content"). By providing Your Content, you represent and warrant that you have all necessary rights and licenses to do so. You are solely responsible and liable for Your Content.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 License Grant</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                By providing Your Content to the Platform, you automatically grant Canada Beaver a <strong>non-exclusive, royalty-free, irrevocable, sublicensable, perpetual, worldwide license</strong> to use, copy, modify, display, publish, distribute, and create derivative works from Your Content in any manner and for any purpose, including marketing and promoting the Platform, without notice, compensation, or approval from you.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Content Removal</h3>
              <p className="text-gray-700 leading-relaxed">
                Canada Beaver reserves the right to remove, edit, limit, or block access to any of Your Content at any time for any reason or no reason, with no obligation to display or review Your Content.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Content and Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to post, upload, or provide any Content that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Contains offensive language or imagery that could harass, upset, or alarm others</li>
                <li>Is obscene, pornographic, violent, or offensive to human dignity</li>
                <li>Is abusive, insulting, threatening, discriminatory, or promotes hatred or bigotry</li>
                <li>Is inaccurate, incomplete, misleading, negligent, or fraudulent</li>
                <li>Encourages illegal activity or constitutes a criminal offense</li>
                <li>Is defamatory or libelous</li>
                <li>Contains spam, junk mail, or unsolicited advertising</li>
                <li>Contains viruses, malware, or other malicious code</li>
                <li>Infringes intellectual property rights or privacy rights of any person</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                You may not access or use the Platform for any purpose that is unlawful or contravenes these Terms. Without limiting the foregoing, you will not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Exploit, reproduce, or distribute any Platform content without authorization</li>
                <li>Scrape, data mine, or use automated tools to access the Platform</li>
                <li>Reverse engineer, decompile, or disassemble any Platform software or code</li>
                <li>Frame content from the Platform on another website</li>
                <li>Impersonate another person or entity or falsely imply endorsement by Canada Beaver</li>
                <li>Interfere with the proper functioning of the Platform or bypass security measures</li>
                <li>Collect personal information of other users inconsistent with our Privacy Policy</li>
                <li>Discriminate against or harass anyone based on protected characteristics</li>
                <li>Damage or adversely affect the performance of the Platform</li>
                <li>Burden network capacity through excessive requests or resource consumption</li>
                <li>Dilute, tarnish, or harm the Canada Beaver brand or trademark</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contractor Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Canada Beaver acts as a marketplace connecting homeowners with contractors. <strong>We do not directly provide renovation services and are not a party to any agreements between homeowners and contractors.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                While we verify contractors on our Platform, we do not guarantee the quality, timeliness, or legality of their work. Users are strongly encouraged to conduct their own due diligence when selecting a contractor, including verifying licenses, insurance, and references.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All intellectual property rights in the Platform, including trademarks, logos, content, software, design elements, and compilation of materials ("Canada Beaver Property"), are owned by or licensed to Canada Beaver and are protected by Canadian and international copyright and trademark laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You are granted a limited, non-exclusive, non-transferable license to access and use the Platform for personal, non-commercial purposes only. Any use of Canada Beaver Property not expressly permitted by these Terms is strictly prohibited and may subject you to civil and criminal penalties.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Payment and Fees</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All payment transactions between homeowners and contractors are handled directly between the parties. Canada Beaver may charge service fees as outlined in our pricing structure, which will be clearly communicated before any transaction.
              </p>
              <p className="text-gray-700 leading-relaxed">
                All fees are in Canadian dollars and non-refundable unless otherwise stated. You are responsible for all applicable taxes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Canada Beaver and its affiliates, directors, officers, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees on a full indemnity basis) arising out of or relating to: (a) your breach of these Terms; (b) Your Content; (c) your use of the Platform; (d) your violation of any law or rights of any third party; or (e) your negligence, fraud, or willful misconduct.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. DISCLAIMER OF WARRANTIES</h2>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6 my-4">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>YOU ACKNOWLEDGE AND AGREE THAT:</strong>
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  (A) THE PLATFORM IS PROVIDED ON AN "AS IS", "AS AVAILABLE", AND "WITH ALL FAULTS" BASIS WITHOUT WARRANTY OF ANY KIND, AND YOUR USE IS ENTIRELY AT YOUR OWN RISK;
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  (B) TO THE MAXIMUM EXTENT PERMITTED BY LAW, CANADA BEAVER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT;
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  (C) CANADA BEAVER DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS;
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (D) YOU ARE SOLELY RESPONSIBLE FOR IMPLEMENTING APPROPRIATE SAFEGUARDS TO PROTECT YOUR SYSTEMS AND DATA.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. LIMITATION OF LIABILITY</h2>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CANADA BEAVER AND ITS AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF DATA, PERSONAL INJURY, OR ANY OTHER DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, WHETHER BASED ON WARRANTY, CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</strong>
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Modifications and Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Canada Beaver reserves the right to modify, suspend, or discontinue the Platform or any portion thereof at any time without notice. We may also modify these Terms at any time. Changes will be effective immediately upon posting.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account and access to the Platform at any time, with or without cause, and with or without notice, for any violation of these Terms or for any other reason.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law and Jurisdiction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without giving effect to any principles of conflicts of law.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You hereby unconditionally and irrevocably consent to the <strong>exclusive jurisdiction of the courts located in Toronto, Ontario</strong> for any action or proceeding arising from or relating to these Terms or the Platform. You waive any objection to venue or forum non conveniens.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. DISPUTE RESOLUTION</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">14.1 Negotiation and Mediation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before initiating any formal dispute resolution proceedings, the parties agree to attempt to resolve any dispute through good faith negotiations for a period of thirty (30) days. If negotiations fail, the parties may agree to participate in non-binding mediation before a mutually acceptable mediator.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">14.2 Arbitration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If both parties agree in writing, any dispute, controversy, or claim arising out of or relating to these Terms or the Platform may be resolved through binding arbitration in accordance with the Arbitration Rules of the ADR Institute of Canada, Inc.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>Arbitration Procedures:</strong>
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                  <li>The arbitration shall be conducted in Toronto, Ontario</li>
                  <li>The arbitration shall be conducted in English</li>
                  <li>The arbitrator shall be agreed upon by both parties, or if no agreement is reached within 30 days, appointed by the ADR Institute of Canada</li>
                  <li>The arbitrator's decision shall be final and binding</li>
                  <li>Judgment upon the award may be entered in any court having jurisdiction</li>
                  <li>Each party shall bear its own costs of arbitration unless otherwise awarded by the arbitrator</li>
                  <li>The arbitration proceedings and award shall be kept confidential</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Important:</strong> Arbitration is voluntary and requires mutual written consent. If the parties do not agree to arbitration, disputes shall be resolved exclusively in the courts located in Toronto, Ontario as specified in Section 13.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">14.3 JURY TRIAL WAIVER</h3>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU UNCONDITIONALLY AND IRREVOCABLY WAIVE THE RIGHT TO A TRIAL BY JURY IN ANY DISPUTE ARISING FROM OR RELATING TO THESE TERMS OR THE PLATFORM, WHETHER RESOLVED IN COURT OR THROUGH ARBITRATION.</strong>
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">14.4 NO CLASS ACTIONS</h3>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-4">
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>YOU WAIVE THE RIGHT TO PARTICIPATE IN ANY CLASS ACTION LAWSUIT, CLASS-WIDE ARBITRATION, PRIVATE ATTORNEY GENERAL ACTION, OR ANY OTHER REPRESENTATIVE PROCEEDING. UNLESS EXPRESSLY AGREED IN WRITING, DISPUTES MAY ONLY BE RESOLVED ON AN INDIVIDUAL BASIS.</strong>
                </p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  The arbitrator or court may not consolidate more than one party's claims and may not otherwise preside over any form of class or representative proceeding.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">14.5 Small Claims Court</h3>
              <p className="text-gray-700 leading-relaxed">
                Notwithstanding the above, either party may bring an action in small claims court if the claim qualifies for small claims court jurisdiction.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Injunctive Relief</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You acknowledge and agree that your breach of these Terms may cause irreparable harm to Canada Beaver that cannot be adequately compensated by monetary damages alone. Therefore, Canada Beaver may seek equitable relief, including injunctive relief and specific performance, without the requirement of posting a bond or proving actual damages.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. General Provisions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.1 Entire Agreement</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Canada Beaver regarding the Platform and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.2 Assignment</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not assign or transfer these Terms without our prior written consent. Canada Beaver may assign or transfer these Terms at any time without notice or consent.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.3 Severability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.4 Waiver</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                No waiver of any provision of these Terms shall be effective unless in writing. The failure to exercise or delay in exercising any right shall not constitute a waiver.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.5 Third Party Rights</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms do not confer any rights or remedies upon any person other than you and Canada Beaver.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.6 Force Majeure</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Canada Beaver shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">16.7 Notices</h3>
              <p className="text-gray-700 leading-relaxed">
                All notices to Canada Beaver must be sent to admin@canadabeaver.pro. We may provide notices to you via email to the address associated with your account or through the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 font-semibold mb-2">Canada Beaver</p>
                <p className="text-gray-600">Email: admin@canadabeaver.pro</p>
                <p className="text-gray-600 mt-2">Address: Across Canada</p>
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