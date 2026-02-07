'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DURATION_MS = 520
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)' // smooth ease-out

export function AnimatedSearchBar({
  isExpanded,
  triggerRect,
  value,
  onChange,
  onClear,
  onClose,
  onKeyDown,
  placeholder,
  inputRef,
  className,
}) {
  const [mounted, setMounted] = useState(false)
  const [animatingToCenter, setAnimatingToCenter] = useState(false)
  const barRef = useRef(null)

  useEffect(() => {
    if (!isExpanded) {
      setMounted(false)
      setAnimatingToCenter(false)
      return
    }
    setMounted(true)
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimatingToCenter(true))
    })
    return () => cancelAnimationFrame(t)
  }, [isExpanded])

  const startStyle = triggerRect
    ? {
        '--start-x': `${triggerRect.left + triggerRect.width / 2}px`,
        '--start-y': `${triggerRect.top + triggerRect.height / 2}px`,
      }
    : {}

  return (
    <div
      ref={barRef}
      role="search"
      aria-label="Search courses"
      className={cn(
        'fixed z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-lg pr-5 pl-4 transition-opacity duration-300 ease-out',
        'w-full max-w-xl',
        mounted ? 'opacity-100' : 'opacity-0',
        animatingToCenter ? 'animate-search-to-center' : 'animate-search-from-trigger',
        className
      )}
      style={{
        ...startStyle,
        '--duration': `${DURATION_MS}ms`,
        '--ease': EASE,
      }}
    >
      <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus
        aria-label="Search courses"
        className="global-search-input flex-1 min-w-0 border-0 outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full h-12 py-3 bg-transparent"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 p-2 rounded-full hover:bg-gray-100 text-gray-500 mr-1"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
