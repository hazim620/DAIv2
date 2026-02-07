'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatedSearchBar } from './AnimatedSearchBar'
import { CourseCard } from '@/components/CourseCard'
import { CourseCardSkeleton } from './CourseCardSkeleton'
import { useLanguage } from '@/contexts/language-context'

const DEBOUNCE_MS = 300
const ROWS = 2
const COLS = 4
const MAX_VISIBLE = ROWS * COLS // 8

export function GlobalSearchOverlay({
  isOpen,
  onClose,
  triggerRect,
  triggerRef,
}) {
  const { locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef(null)
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const debounceRef = useRef(null)

  const runSearch = useCallback(
    async (q) => {
      if (q.trim()) {
        setLoading(true)
        setHasSearched(true)
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&locale=${locale}`,
            { credentials: 'include' }
          )
          const data = await res.json()
          setCourses(data.courses || [])
        } catch (err) {
          setCourses([])
        } finally {
          setLoading(false)
        }
      } else {
        setHasSearched(false)
        setLoading(false)
        setCourses([])
      }
    },
    [locale]
  )

  const fetchRecommended = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=&locale=${locale}`, {
        credentials: 'include',
      })
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (err) {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setHasSearched(false)
    setCourses([])
    document.body.style.overflow = 'hidden'
    fetchRecommended()
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, fetchRecommended])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setCourses([])
      setHasSearched(false)
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
  }, [query, runSearch])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleBackdropClick = () => onClose()

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) setQuery('')
      else onClose()
    }
  }

  if (typeof document === 'undefined' || !isOpen) return null

  const effectiveRect =
    triggerRect ||
    (typeof window !== 'undefined'
      ? {
          left: window.innerWidth - 180,
          top: 72,
          width: 160,
          height: 40,
        }
      : null)

  const title =
    query.trim() && hasSearched
      ? (locale === 'ar' ? 'نتائج البحث' : 'Results')
      : locale === 'ar'
        ? 'موصى بها'
        : 'Recommended'

  const recommendedContent =
    !query.trim() &&
    (loading ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: MAX_VISIBLE }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    ) : courses.length > 0 ? (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {courses.slice(0, MAX_VISIBLE).map((course) => (
            <CourseCard key={course.id} course={course} locale={locale} onClick={onClose} />
          ))}
        </div>
        {courses.length > MAX_VISIBLE && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/courses"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 px-8 py-3.5 text-base font-semibold shadow-lg hover:bg-gray-100 transition-colors border border-white/30"
            >
              {locale === 'ar' ? 'المزيد' : 'More'}
            </Link>
          </div>
        )}
      </>
    ) : null)

  const resultsContent = query.trim() && (
    <>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: MAX_VISIBLE }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-gray-500 text-center py-8" role="status">
          {locale === 'ar'
            ? `لا توجد نتائج لـ "${query}"`
            : `No results for "${query}"`}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {courses.slice(0, MAX_VISIBLE).map((course) => (
              <CourseCard key={course.id} course={course} locale={locale} onClick={onClose} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href={query.trim() ? `/courses?q=${encodeURIComponent(query.trim())}` : '/courses'}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 px-8 py-3.5 text-base font-semibold shadow-lg hover:bg-gray-100 transition-colors border border-white/30"
            >
              {locale === 'ar' ? 'المزيد' : 'More'}
            </Link>
          </div>
        </>
      )}
    </>
  )

  const overlay = (
    <div
      ref={overlayRef}
      data-search-overlay
      role="dialog"
      aria-modal="true"
      aria-label={locale === 'ar' ? 'بحث الدورات' : 'Search courses'}
      className="fixed inset-0 z-40 transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ opacity: isOpen ? 1 : 0 }}
    >
      {/* Clickable backdrop – clicking outside content closes */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className="relative z-10 pt-[18vh] flex flex-col items-center w-full max-w-[1800px] mx-auto px-6 md:px-8 lg:px-10 max-h-screen min-h-0"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatedSearchBar
          isExpanded={isOpen}
          triggerRect={effectiveRect}
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          onClose={onClose}
          onKeyDown={handleInputKeyDown}
          placeholder={locale === 'ar' ? 'ابحث عن دورات...' : 'Search courses...'}
          inputRef={inputRef}
        />
        <div className="flex-1 w-full mt-14 pb-12 min-h-0 search-overlay-scroll">
          <h2 className="text-lg font-semibold text-white mb-4">
            {title}
          </h2>
          {!query.trim() ? recommendedContent : resultsContent}
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
