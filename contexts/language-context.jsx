'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getTranslation } from '@/lib/i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('ar')

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'ar'
    setLocale(savedLocale)
    document.documentElement.lang = savedLocale
    document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr'
  }, [])

  const changeLocale = (newLocale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
  }

  const t = (key) => getTranslation(locale, key)

  return (
    <LanguageContext.Provider value={{ locale, changeLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
