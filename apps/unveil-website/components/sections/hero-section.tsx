'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Smartphone, Users, Heart } from 'lucide-react'
import { scrollToSection } from '@/lib/utils'

export function HeroSection() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-unveil-gradient-subtle opacity-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-purple-200 text-purple-700 text-sm font-medium mb-6">
            <Heart className="h-3 w-3" />
            Wedding Management Made Simple
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Your Wedding,{' '}
            <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Beautifully
            </span>{' '}
            Coordinated
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your wedding planning with seamless guest communication, 
            instant memory sharing, and real-time coordination. 
            Everything you need to make your special day unforgettable.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              variant="gradient" 
              size="lg" 
              className="text-base px-8"
              onClick={() => scrollToSection('download')}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => scrollToSection('features')}
            >
              See How It Works
            </Button>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur border border-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
                <Smartphone className="h-5 w-5 text-rose-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Mobile First</div>
                <div className="text-xs text-muted-foreground">iOS & Android</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur border border-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Guest Management</div>
                <div className="text-xs text-muted-foreground">RSVP & Communication</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur border border-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Memory Sharing</div>
                <div className="text-xs text-muted-foreground">Photos & Messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 