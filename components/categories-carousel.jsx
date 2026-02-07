'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useLanguage } from '@/contexts/language-context'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CARD_GAP = 24
const AUTOPLAY_MS = 5000
const TRANSITION_MS = 320

const FALLBACK_CATEGORIES = [
  { id: 'prompt-engineering', title: { en: 'Prompt Engineering', ar: 'هندسة التلميحات' }, slug: 'prompt-engineering', imageUrl: 'https://picsum.photos/seed/pe/600/340', order: 1, isFeatured: true },
  { id: 'chatgpt', title: { en: 'ChatGPT', ar: 'شات جي بي تي' }, slug: 'chatgpt', imageUrl: 'https://picsum.photos/seed/cgpt/600/340', order: 2, isFeatured: true },
  { id: 'data-science', title: { en: 'Data Science', ar: 'علوم البيانات' }, slug: 'data-science', imageUrl: 'https://picsum.photos/seed/ds/600/340', order: 3, isFeatured: true },
  { id: 'machine-learning', title: { en: 'Machine Learning', ar: 'التعلّم الآلي' }, slug: 'machine-learning', imageUrl: 'https://picsum.photos/seed/ml/600/340', order: 4, isFeatured: true },
  { id: 'python', title: { en: 'Python', ar: 'بايثون' }, slug: 'python', imageUrl: 'https://picsum.photos/seed/py/600/340', order: 5, isFeatured: true },
]

function getTitle(category, locale) {
  if (!category.title) return ''
  return typeof category.title === 'object' ? category.title[locale] || category.title.en || category.title.ar : category.title
}

function CategoryCard({ category, locale, className = '' }) {
  const title = getTitle(category, locale)
  const href = `/courses?category=${category.slug || category.id}`
  const imgSrc = category.imageUrl && (category.imageUrl.startsWith('http') || category.imageUrl.startsWith('/'))

  return (
    <Link
      href={href}
      className={`group relative flex-shrink-0 flex flex-col rounded-3xl min-h-[520px] w-full min-w-[340px] max-w-[540px] cursor-pointer overflow-hidden
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)] hover:-translate-y-0.5
        active:translate-y-0 active:shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        transition-all duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2
        ${className}`}
      style={{ transitionDuration: `${TRANSITION_MS}ms` }}
    >
      {/* Full-card image */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        {imgSrc ? (
          <NextImage
            src={category.imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 540px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/30">
            <span className="text-gray-600 font-semibold text-lg" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Bottom panel over image */}
      <div
        className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-8 min-h-[96px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:bg-white transition-colors"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <span className="font-semibold text-slate-900 text-lg leading-tight truncate flex-1 min-w-0" title={title}>
          {title}
        </span>
        <span className="flex-shrink-0 text-slate-600 group-hover:text-sky-600 transition-colors" aria-hidden>
          {locale === 'ar' ? <ChevronLeft className="w-[18px] h-[18px]" /> : <ChevronRight className="w-[18px] h-[18px]" />}
        </span>
      </div>
    </Link>
  )
}

function CategoryCardSkeleton({ className = '' }) {
  return (
    <div className={`relative flex-shrink-0 rounded-3xl min-h-[520px] w-full min-w-[340px] max-w-[540px] overflow-hidden bg-gray-100/40 animate-pulse ${className}`}>
      <div className="absolute inset-0 bg-gray-100/40" />
      <div className="absolute bottom-3 left-3 right-3 h-[96px] rounded-2xl bg-white/80" />
    </div>
  )
}

export function CategoriesCarousel() {
  const { locale } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const carouselRef = useRef(null)
  const sectionRef = useRef(null)
  const autoplayRef = useRef(null)

  useEffect(() => {
    fetch(`/api/categories?locale=${locale}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        const list = data?.categories || []
        setCategories(list.length > 0 ? list : FALLBACK_CATEGORIES)
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setLoading(false))
  }, [locale])

  const updateVisibleCount = useCallback(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024
    if (w < 768) setVisibleCount(1)
    else if (w < 1024) setVisibleCount(2)
    else setVisibleCount(3)
  }, [])

  useEffect(() => {
    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)
    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [updateVisibleCount])

  const totalPages = Math.max(1, Math.ceil(categories.length / visibleCount))
  const [docRTL, setDocRTL] = useState(true)
  useEffect(() => {
    setDocRTL(typeof document !== 'undefined' && document.documentElement?.dir === 'rtl')
  }, [])
  const isRTL = docRTL || locale === 'ar'

  const updateScrollState = useCallback(() => {
    const el = carouselRef.current
    if (!el || categories.length === 0) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const threshold = 10
    if (isRTL) {
      setCanScrollPrev(scrollLeft < -threshold)
      setCanScrollNext(scrollLeft > -(scrollWidth - clientWidth) + threshold)
    } else {
      setCanScrollPrev(scrollLeft > threshold)
      setCanScrollNext(scrollLeft < scrollWidth - clientWidth - threshold)
    }
  }, [categories.length, isRTL])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState)
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [categories.length, visibleCount, updateScrollState])

  const scrollToPage = useCallback((pageIndex) => {
    const el = carouselRef.current
    if (!el) return
    const pageWidth = el.clientWidth
    const left = isRTL ? -(pageWidth * pageIndex) : pageWidth * pageIndex
    el.scrollTo({ left, behavior: 'smooth' })
    setPage(Math.max(0, Math.min(pageIndex, totalPages - 1)))
  }, [totalPages, isRTL])

  const goPrev = useCallback(() => {
    if (!canScrollPrev) return
    scrollToPage(page - 1)
  }, [canScrollPrev, page, scrollToPage])

  const goNext = useCallback(() => {
    if (!canScrollNext) return
    scrollToPage(page + 1)
  }, [canScrollNext, page, scrollToPage])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const onScroll = () => {
      const pageWidth = el.clientWidth
      if (!pageWidth) return
      const raw = el.scrollLeft / pageWidth
      const newPage = Math.round(isRTL ? -raw : raw)
      setPage(Math.max(0, Math.min(newPage, totalPages - 1)))
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [totalPages, categories.length, isRTL])

  useEffect(() => {
    if (autoplayPaused || categories.length <= visibleCount || totalPages <= 1) return
    autoplayRef.current = setInterval(() => {
      setPage((p) => {
        const next = p + 1 >= totalPages ? 0 : p + 1
        scrollToPage(next)
        return next
      })
    }, AUTOPLAY_MS)
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
    }
  }, [autoplayPaused, categories.length, visibleCount, totalPages, scrollToPage])

  const handleKeyDown = useCallback((e) => {
    if (!sectionRef.current?.contains(document.activeElement)) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (locale === 'ar') goNext()
      else goPrev()
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (locale === 'ar') goPrev()
      else goNext()
    }
  }, [locale, goPrev, goNext])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const showCarousel = !error && categories.length > 0
  const showControls = showCarousel && categories.length > visibleCount

  if (loading) {
    return (
      <section className="py-16" aria-label={locale === 'ar' ? 'تصنيفات الدورات' : 'Course categories'}>
        <div className="w-full mx-auto px-4 max-w-[1800px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-9">
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <CategoryCardSkeleton key={i} className="w-[min(100%,340px)] md:w-[400px] lg:w-[480px]" />
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center lg:pl-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  const cardFlexBasis = visibleCount === 1
    ? '100%'
    : `calc((100% - ${(visibleCount - 1) * CARD_GAP}px) / ${visibleCount})`

  return (
    <section
      ref={sectionRef}
      className="py-16"
      aria-label={locale === 'ar' ? 'تصنيفات الدورات' : 'Course categories'}
      onMouseEnter={() => setAutoplayPaused(true)}
      onMouseLeave={() => setAutoplayPaused(false)}
      onFocusWithin={() => setAutoplayPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAutoplayPaused(false) }}
    >
      <div className="w-full mx-auto px-4 max-w-[1800px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Carousel - wider column for bigger cards */}
          <div className="lg:col-span-9 order-2 lg:order-2">
            <div className="relative">
              {showControls && (
                <>
                  {/* Previous: in RTL on the right (start side), in LTR on the left */}
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={!canScrollPrev}
                    aria-label={locale === 'ar' ? 'السابق' : 'Previous'}
                    className={`absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      canScrollPrev ? 'hover:bg-gray-50' : 'opacity-40 pointer-events-none'
                    } ${isRTL ? 'right-0 translate-x-1/2 md:translate-x-0' : 'left-0 -translate-x-1/2 md:translate-x-0'}`}
                  >
                    {isRTL ? <ChevronRight className="h-6 w-6" aria-hidden /> : <ChevronLeft className="h-6 w-6" aria-hidden />}
                  </button>
                  {/* Next: in RTL on the left (end side), in LTR on the right */}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canScrollNext}
                    aria-label={locale === 'ar' ? 'التالي' : 'Next'}
                    className={`absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      canScrollNext ? 'hover:bg-gray-50' : 'opacity-40 pointer-events-none'
                    } ${isRTL ? 'left-0 -translate-x-1/2 md:translate-x-0' : 'right-0 translate-x-1/2 md:translate-x-0'}`}
                  >
                    {isRTL ? <ChevronLeft className="h-6 w-6" aria-hidden /> : <ChevronRight className="h-6 w-6" aria-hidden />}
                  </button>
                </>
              )}
              <div
                ref={carouselRef}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth flex gap-6 pb-2 -mx-1 px-1"
                style={{ scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
                role="region"
                aria-roledescription="carousel"
                aria-label={locale === 'ar' ? 'تصنيفات الدورات' : 'Course categories'}
                onTouchStart={() => setAutoplayPaused(true)}
                onMouseDown={() => setAutoplayPaused(true)}
              >
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex-shrink-0 min-w-0"
                    style={{ flexBasis: cardFlexBasis, scrollSnapAlign: 'start' }}
                    data-category-card
                  >
                    <CategoryCard category={cat} locale={locale} />
                  </div>
                ))}
              </div>
            </div>
            {showControls && totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label={locale === 'ar' ? 'صفحات التصنيفات' : 'Category pages'}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={page === i}
                    aria-current={page === i ? 'true' : undefined}
                    aria-label={locale === 'ar' ? `الصفحة ${i + 1}` : `Page ${i + 1}`}
                    onClick={() => scrollToPage(i)}
                    className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      page === i ? 'w-6 bg-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text block - on the right */}
          <div className={`lg:col-span-3 flex flex-col justify-center order-1 lg:order-1 ${locale === 'ar' ? 'lg:text-right lg:items-end' : 'lg:text-left'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {locale === 'ar' ? (
                <>تعلّم <em className="italic text-primary">المهارات الأساسية</em> للمهنة والحياة</>
              ) : (
                <>Learn <em className="italic text-primary">essential</em> career and life skills</>
              )}
            </h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-md text-right w-full">
              {locale === 'ar'
                ? 'اختر تصنيفاً لاستكشاف الدورات المناسبة لك.'
                : 'Choose a category to find courses that fit your goals.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
