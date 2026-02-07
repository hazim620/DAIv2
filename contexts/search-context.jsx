'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { GlobalSearchOverlay } from '@/components/search/GlobalSearch'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState(null)

  const open = useCallback((rect) => {
    setTriggerRect(rect ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTriggerRect(null)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) close()
        else open(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, open, close])

  return (
    <SearchContext.Provider value={{ isOpen, open, close, triggerRect }}>
      {children}
      <GlobalSearchOverlay
        isOpen={isOpen}
        onClose={close}
        triggerRect={triggerRect}
      />
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within SearchProvider')
  return ctx
}
