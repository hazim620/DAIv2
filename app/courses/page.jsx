'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { CourseCard } from '@/components/CourseCard'
import { CourseCardSkeleton } from '@/components/search/CourseCardSkeleton'
import { useLanguage } from '@/contexts/language-context'
import { Search, BookOpen, ChevronRight, SlidersHorizontal } from 'lucide-react'

const PAGE_SIZE = 12

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelAr: 'الكل' },
  { id: 'data-science', labelEn: 'Data Science', labelAr: 'علوم البيانات' },
  { id: 'ai', labelEn: 'Artificial Intelligence', labelAr: 'الذكاء الاصطناعي' },
  { id: 'python', labelEn: 'Python', labelAr: 'بايثون' },
]

const LEVELS = [
  { id: 'all', labelEn: 'All levels', labelAr: 'جميع المستويات' },
  { id: 'beginner', labelEn: 'Beginner', labelAr: 'مبتدئ' },
  { id: 'intermediate', labelEn: 'Intermediate', labelAr: 'متوسط' },
  { id: 'advanced', labelEn: 'Advanced', labelAr: 'متقدم' },
]

const PRICE_FILTERS = [
  { id: 'all', labelEn: 'All', labelAr: 'الكل' },
  { id: 'free', labelEn: 'Free', labelAr: 'مجاني' },
  { id: 'paid', labelEn: 'Paid', labelAr: 'مدفوع' },
]

const SORT_OPTIONS = [
  { id: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
  { id: 'popular', labelEn: 'Most popular', labelAr: 'الأكثر شعبية' },
  { id: 'price-asc', labelEn: 'Price: low to high', labelAr: 'السعر: من الأقل للأعلى' },
  { id: 'price-desc', labelEn: 'Price: high to low', labelAr: 'السعر: من الأعلى للأقل' },
]

export default function CoursesPage() {
  const { locale, t } = useLanguage()
  const searchParams = useSearchParams()
  const qFromUrl = searchParams.get('q') || ''
  const [courses, setCourses] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState(qFromUrl)
  const [searchQuery, setSearchQuery] = useState(qFromUrl)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const sentinelRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setSearchInput((prev) => (qFromUrl !== prev ? qFromUrl : prev))
    setSearchQuery((prev) => (qFromUrl !== prev ? qFromUrl : prev))
  }, [qFromUrl])

  const fetchPage = useCallback(
    async (offset, append = false) => {
      const params = new URLSearchParams({
        locale,
        list: '1',
        limit: String(PAGE_SIZE),
        offset: String(offset),
        category: selectedCategory,
        level: selectedLevel,
        price: selectedPrice,
        sort,
      })
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const res = await fetch(`/api/courses?${params}`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const list = data.courses || []
      const totalCount = data.total ?? list.length
      const more = data.hasMore ?? (list.length === PAGE_SIZE)

      if (append) {
        setCourses((prev) => [...prev, ...list])
      } else {
        setCourses(list)
      }
      setTotal(totalCount)
      setHasMore(more)
      return list.length
    },
    [locale, searchQuery, selectedCategory, selectedLevel, selectedPrice, sort]
  )

  useEffect(() => {
    setCourses([])
    setHasMore(true)
    setLoading(true)
    fetchPage(0, false).finally(() => setLoading(false))
  }, [fetchPage])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchInput === searchQuery) return
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setLoadingMore(true)
        fetchPage(courses.length, true)
          .finally(() => setLoadingMore(false))
      },
      { rootMargin: '200px', threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, courses.length, fetchPage])

  const isRTL = locale === 'ar'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 w-full max-w-[1800px] mx-auto px-6 md:px-8 lg:px-10 py-8 md:py-10">
        {/* Recreated header block: title, tagline, search, categories */}
        <header className="rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-8">
          <div className={`flex flex-col gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {t('allCourses')}
              </h1>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {locale === 'ar' ? 'ابحث واختر الدورة المناسبة لك' : 'Find and choose the right course for you'}
              </p>
            </div>

            <label htmlFor="courses-search" className="sr-only">
              {locale === 'ar' ? 'ابحث عن دورة' : 'Search courses'}
            </label>
            <div className="max-w-xl">
              <div className="relative">
                <Search
                  className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`}
                  aria-hidden
                />
                <input
                  id="courses-search"
                  type="search"
                  placeholder={locale === 'ar' ? 'ابحث عن دورة أو مدرب...' : 'Search by course or instructor...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm ${
                    isRTL ? 'pl-3 pr-10 text-right' : 'pl-10 pr-3'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                {locale === 'ar' ? 'التصنيف' : 'Category'}
              </p>
              <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-start' : 'justify-start'}`}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {locale === 'ar' ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Filters row: level, price, sort + toggle on mobile */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {locale === 'ar' ? 'فلاتر' : 'Filters'}
          </button>

          <div className={`flex flex-wrap items-center gap-4 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {locale === 'ar' ? 'المستوى:' : 'Level:'}
              </span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {LEVELS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {locale === 'ar' ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {locale === 'ar' ? 'السعر:' : 'Price:'}
              </span>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {PRICE_FILTERS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {locale === 'ar' ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {locale === 'ar' ? 'ترتيب:' : 'Sort:'}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {locale === 'ar' ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!loading && (
            <p className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
              {total} {locale === 'ar' ? 'دورة' : total === 1 ? 'course' : 'courses'}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} className="rounded-2xl min-h-[360px]" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div
            className={`rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 px-8 text-center ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-6">
              <BookOpen className="h-8 w-8" aria-hidden />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
              {searchQuery.trim()
                ? (locale === 'ar' ? 'لم يتم العثور على دورات' : 'No courses found')
                : locale === 'ar'
                  ? 'لا توجد دورات متاحة حالياً'
                  : 'No courses available at the moment'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {searchQuery.trim()
                ? (locale === 'ar' ? 'جرّب تغيير البحث أو الفئة' : 'Try changing your search or filters')
                : locale === 'ar'
                  ? 'عد لاحقاً أو استكشف الصفحة الرئيسية'
                  : 'Check back later or explore the homepage'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 text-primary font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            >
              {locale === 'ar' ? 'العودة للرئيسية' : 'Back to home'}
              <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} locale={locale} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-4 w-4 my-8" aria-hidden />
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CourseCardSkeleton key={`more-${i}`} className="rounded-2xl min-h-[360px]" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
