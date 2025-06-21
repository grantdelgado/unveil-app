'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Heart } from 'lucide-react'
import { scrollToSection } from '@/lib/utils'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Guest Consent', href: '#guest-consent' },
    { label: 'Policies', href: '#policies' },
  ]

  const handleNavClick = (href: string) => {
    const sectionId = href.replace('#', '')
    scrollToSection(sectionId)
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-unveil-gradient">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">Unveil</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex">
            <Button 
              variant="gradient" 
              size="sm"
              onClick={() => scrollToSection('download')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <Button 
                variant="gradient" 
                size="sm" 
                className="mt-2 w-fit"
                onClick={() => {
                  scrollToSection('download')
                  setIsMenuOpen(false)
                }}
              >
                Get Started
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 