import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero-section'
import { GuestConsentProof } from '@/components/sections/guest-consent-proof'
import { PoliciesSection } from '@/components/sections/policies-section'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <GuestConsentProof />
        <PoliciesSection />
      </main>
      <Footer />
    </>
  )
} 