import { Shield, Check, MessageSquare, AlertCircle } from 'lucide-react'

export function GuestConsentProof() {
  return (
    <section id="guest-consent" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
              <Shield className="h-3 w-3" />
              SMS Consent Documentation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Guest Consent Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Documentation of our transparent guest consent process for SMS communications, 
              ensuring compliance with A2P 10DLC requirements.
            </p>
          </div>

          {/* Consent Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12" role="region" aria-labelledby="consent-flow">
            {/* Consent Flow Screenshot */}
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-lg">
                <div className="aspect-[9/16] bg-white rounded-xl shadow-inner overflow-hidden border" role="img" aria-label="Mobile app screenshot showing SMS consent flow for wedding guests">
                  {/* Mobile App Mockup */}
                  <div className="h-full flex flex-col">
                    {/* Status Bar */}
                    <div className="bg-gray-50 px-4 py-1 flex justify-between items-center text-xs">
                      <span>9:41</span>
                      <span>•••</span>
                      <span>100%</span>
                    </div>
                    
                    {/* Header */}
                    <div className="bg-unveil-gradient text-white px-4 py-3 text-center">
                      <div className="text-sm font-medium">Join Sarah & Mike&apos;s Wedding</div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4 space-y-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-unveil-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm mb-2">SMS Notifications</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Get wedding updates, RSVP confirmations, and event reminders via text message.
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 text-xs">
                        <div className="font-medium text-blue-900 mb-1">What you&apos;ll receive:</div>
                        <ul className="text-blue-800 space-y-1">
                          <li>• Event updates & changes</li>
                          <li>• RSVP confirmations</li>
                          <li>• Schedule reminders</li>
                        </ul>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        Reply STOP to opt out anytime
                      </div>
                    </div>
                    
                    {/* Buttons */}
                    <div className="p-4 space-y-2">
                      <div className="w-full bg-unveil-gradient text-white rounded-lg py-3 text-sm font-medium text-center" role="button" aria-label="Accept SMS notifications for wedding updates">
                        ✓ Yes, send me SMS updates
                      </div>
                      <div className="w-full border border-gray-300 rounded-lg py-3 text-sm text-gray-600 text-center" role="button" aria-label="Decline SMS notifications and continue">
                        Continue without SMS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Consent Details */}
            <div className="order-1 lg:order-2 space-y-6">
              <h3 id="consent-flow" className="text-2xl font-bold">Clear Consent Process</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Explicit Opt-In Required</div>
                    <div className="text-sm text-muted-foreground">
                      Guests must actively consent to receive SMS messages before joining the wedding communication platform.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Clear Purpose Statement</div>
                    <div className="text-sm text-muted-foreground">
                      Guests understand they will receive wedding-related updates, RSVP confirmations, and event reminders.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Easy Opt-Out Process</div>
                    <div className="text-sm text-muted-foreground">
                      Guests can easily unsubscribe by replying &quot;STOP&quot; to any message or through the app settings.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Consent Verification</div>
                    <div className="text-sm text-muted-foreground">
                      Digital record of consent is maintained for each guest with timestamp and IP address.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">A2P 10DLC Compliance</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This consent process meets all A2P 10DLC requirements for wedding communication platforms. 
                  Guests provide explicit, informed consent before receiving any SMS communications, 
                  and all consent records are properly maintained for audit purposes.
                </p>
                <div className="mt-3 text-xs text-blue-700">
                  <strong>Use Case:</strong> Mixed - Wedding event coordination and guest communication
                  <br />
                  <strong>Message Types:</strong> Event updates, RSVP confirmations, schedule reminders
                </div>
              </div>
            </div>
          </div>

          {/* Message Examples */}
          <div className="mt-12">
            <h4 className="text-lg font-semibold mb-6 text-center">Example Messages</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-muted-foreground mb-2">Welcome Message</div>
                <div className="text-sm">
                  &quot;Welcome to Sarah &amp; Mike&apos;s wedding! 🎉 You&apos;ll receive updates about the ceremony, 
                  reception, and other wedding details. Reply STOP to opt out anytime.&quot;
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-muted-foreground mb-2">Event Reminder</div>
                <div className="text-sm">
                  &quot;Reminder: Sarah &amp; Mike&apos;s ceremony starts at 4 PM tomorrow at Sunset Gardens. 
                  See you there! Reply STOP to unsubscribe.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 