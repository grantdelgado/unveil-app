import { FileText, Shield, Scale, Mail } from 'lucide-react'

export function PoliciesSection() {
  return (
    <section id="policies" className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-4">
              <FileText className="h-3 w-3" />
              Legal Documentation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Policies & Terms
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our commitment to transparency and compliance through clear policies 
              and terms of service.
            </p>
          </div>

          {/* Policy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">SMS Consent Policy</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Detailed policy explaining how we obtain and manage guest consent for SMS communications.
              </p>
              <a
                href="#sms-consent-policy"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Read Policy →
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive privacy policy covering data collection, usage, and protection practices.
              </p>
              <a
                href="#privacy-policy"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Read Policy →
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 mb-4">
                <Scale className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Terms and conditions governing the use of our wedding management platform.
              </p>
              <a
                href="#terms-of-service"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Read Terms →
              </a>
            </div>
          </div>

          {/* SMS Consent Policy */}
          <div id="sms-consent-policy" className="mb-12">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                SMS Consent Policy
              </h3>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground mb-4">
                  <strong>Effective Date:</strong> January 1, 2025
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">1. Consent Collection</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Unveil collects explicit consent from wedding guests before sending any SMS messages. 
                      Guests must actively opt-in by providing their phone number and agreeing to receive 
                      wedding-related communications through our platform.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. Message Types</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Consented guests will receive the following types of messages:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• RSVP confirmations and reminders</li>
                      <li>• Wedding ceremony and reception updates</li>
                      <li>• Schedule changes and important announcements</li>
                      <li>• Photo sharing notifications</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. Opt-Out Process</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Guests can opt out of SMS communications at any time by:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                              <li>• Replying &quot;STOP&quot; to any SMS message</li>
                      <li>• Updating preferences in the Unveil app</li>
                      <li>• Contacting our support team</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">4. Data Protection</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Phone numbers and consent records are securely stored and never shared with third parties 
                      for marketing purposes. All data is encrypted and handled in accordance with applicable 
                      privacy laws.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div id="privacy-policy" className="mb-12">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                Privacy Policy
              </h3>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground mb-4">
                  <strong>Effective Date:</strong> January 1, 2025
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">1. Information We Collect</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We collect information you provide directly to us, including phone numbers, names, 
                      email addresses, and RSVP responses. We also collect photos and messages shared 
                      through our platform.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. How We Use Your Information</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your information is used to facilitate wedding communication, manage RSVPs, 
                      share photos and memories, and send relevant updates about wedding events.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. Information Sharing</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We do not sell, trade, or otherwise transfer your personal information to third parties 
                      for marketing purposes. Information is only shared with other wedding guests as 
                      intended by the platform functionality.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">4. Data Security</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We implement industry-standard security measures to protect your personal information 
                      against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 mx-auto mb-4">
              <Mail className="h-6 w-6 text-gray-600" />
            </div>
            <h4 className="font-semibold mb-2">Questions About Our Policies?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about our policies or practices, please contact us.
            </p>
            <a
              href="mailto:legal@sendunveil.com"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              legal@sendunveil.com
            </a>
          </div>
        </div>
      </div>
    </section>
  )
} 