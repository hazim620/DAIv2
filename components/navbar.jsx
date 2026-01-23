'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { getTranslation } from '@/lib/i18n'
import { useState, useEffect } from 'react'

export function Navbar() {
  const [locale, setLocale] = useState('en')
  const t = (key) => getTranslation(locale, key)

  useEffect(() => {
    setLocale(localStorage.getItem('locale') || 'en')
  }, [])

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              DAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('home')}
              </Link>
              <Link href="/courses" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('courses')}
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('about')}
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('contact')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost">{t('login')}</Button>
            </Link>
            <Link href="/signup">
              <Button>{t('signup')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
