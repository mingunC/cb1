import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' }
    ],
    services: [
      { name: 'Request a Quote', href: '/quote-request' },
      { name: 'Find Professionals', href: '/pros' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Events', href: '/events' }
    ],
    support: [
      { name: 'Customer Support', href: '/support' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'User Guide', href: '/guide' }
    ]
  }

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Renovation
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Trusted professionals ready to transform your space. Connect with verified experts across Canada.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-400 hover:text-amber-400 transition-colors">
                <Mail className="h-4 w-4 mr-3 text-amber-600" />
                <span className="text-sm">support@renovation.com</span>
              </div>
              <div className="flex items-center text-gray-400 hover:text-amber-400 transition-colors">
                <Phone className="h-4 w-4 mr-3 text-amber-600" />
                <span className="text-sm">1-800-RENOVATE</span>
              </div>
              <div className="flex items-center text-gray-400 hover:text-amber-400 transition-colors">
                <MapPin className="h-4 w-4 mr-3 text-amber-600" />
                <span className="text-sm">Across Canada</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-amber-400">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-amber-400">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-amber-400">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Media */}
            <div className="mt-8">
              <h4 className="font-semibold mb-4 text-amber-400">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="bg-gray-800 hover:bg-amber-600 p-3 rounded-lg transition-all duration-300 group"
                      aria-label={social.name}
                    >
                      <Icon className="h-5 w-5 text-gray-400 group-hover:text-white" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-800 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Renovation Platform. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <span>Business License: 123-45-67890</span>
              <span>Tel: 416-555-1234</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
