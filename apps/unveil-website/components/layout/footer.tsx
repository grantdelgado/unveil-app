'use client'

import { Heart, Mail, Phone } from 'lucide-react'
import { scrollToSection } from '@/lib/utils'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId)
  }

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-unveil-gradient">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold">Unveil</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Transform your wedding planning with seamless guest communication, 
              memory sharing, and coordination tools designed for your special day.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNavClick('features')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('guest-consent')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Guest Consent
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('policies')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Policies
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a 
                  href="mailto:hello@sendunveil.com"
                  className="hover:text-foreground transition-colors"
                >
                  hello@sendunveil.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a 
                  href="tel:+1-555-UNVEIL"
                  className="hover:text-foreground transition-colors"
                >
                  (555) UNVEIL
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Unveil. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <button
                onClick={() => handleNavClick('policies')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => handleNavClick('policies')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                SMS Consent Policy
              </button>
              <button
                onClick={() => handleNavClick('policies')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 