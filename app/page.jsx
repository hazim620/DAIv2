'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Navbar } from '@/components/navbar'
import { CategoriesCarousel } from '@/components/categories-carousel'
import { CourseCard } from '@/components/CourseCard'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen, Users, Award, PlayCircle, ChevronRight, ChevronLeft } from 'lucide-react'

export default function Home() {
  const { locale, t } = useLanguage()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [carouselAtStart, setCarouselAtStart] = useState(true)
  const [carouselAtEnd, setCarouselAtEnd] = useState(false)
  const carouselRef = useRef(null)

  useEffect(() => {
    fetch(`/api/courses?locale=${locale}&list=1`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { courses: [] }))
      .then((data) => {
        setCourses(data?.courses || [])
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [locale])

  const categories = [
    { id: 'all', labelEn: 'All', labelAr: 'الكل' },
    { id: 'data-science', labelEn: 'Data Science', labelAr: 'علوم البيانات' },
    { id: 'ai', labelEn: 'Artificial Intelligence', labelAr: 'الذكاء الاصطناعي' },
    { id: 'python', labelEn: 'Python', labelAr: 'بايثون' },
  ]

  const getCourseCategory = (course) => {
    const cat = course.category || ''
    const title = typeof course.title === 'string' ? course.title : (course.title?.en || course.title?.ar || '')
    const desc = typeof course.description === 'string' ? course.description : (course.description?.en || course.description?.ar || '')
    const text = `${cat} ${title} ${desc}`.toLowerCase()
    if (text.includes('data') || text.includes('بيانات')) return 'data-science'
    if (text.includes('ai') || text.includes('ذكاء') || text.includes('artificial')) return 'ai'
    if (text.includes('python') || text.includes('بايثون')) return 'python'
    return 'all'
  }

  const filteredCourses =
    selectedCategory === 'all'
      ? courses
      : courses.filter((c) => getCourseCategory(c) === selectedCategory)

  const updateCarouselBounds = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const threshold = 10
    // RTL: scrollLeft 0 = start (first course on right), negative when scrolled left
    const atStart = scrollLeft >= -threshold
    const atEnd = scrollLeft <= -(scrollWidth - clientWidth) + threshold
    setCarouselAtStart(atStart)
    setCarouselAtEnd(atEnd)
  }, [])

  useEffect(() => {
    const el = carouselRef.current
    if (!el || filteredCourses.length === 0) return
    updateCarouselBounds()
    el.addEventListener('scroll', updateCarouselBounds)
    const ro = new ResizeObserver(updateCarouselBounds)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateCarouselBounds)
      ro.disconnect()
    }
  }, [selectedCategory, filteredCourses.length, updateCarouselBounds])

  const CARD_WIDTH = 400
  const CARD_GAP = 16
  const scrollCarousel = (dir) => {
    const el = carouselRef.current
    if (!el) return
    const stepPerCard = CARD_WIDTH + CARD_GAP
    const step = stepPerCard * 3
    // RTL carousel: scrollBy sign is reversed so prev/next match the arrow direction
    const left = dir === 'prev' ? step : -step
    el.scrollBy({ left, behavior: 'smooth' })
  }

  const isRTL = locale === 'ar'
  const btnBase = 'absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
  // LTR: Prev left (arrow left), Next right (arrow right). RTL: Prev right (arrow right toward start), Next left (arrow left toward end)
  const prevBtnPos = isRTL ? 'right-0 translate-x-1/2 md:translate-x-0' : 'left-0 -translate-x-1/2 md:translate-x-0'
  const nextBtnPos = isRTL ? 'left-0 -translate-x-1/2 md:translate-x-0' : 'right-0 translate-x-1/2 md:translate-x-0'
  const prevDisabled = carouselAtStart ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'
  const nextDisabled = carouselAtEnd ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'

  const features = [
    {
      icon: BookOpen,
      title: locale === 'ar' ? 'دورات شاملة' : 'Comprehensive Courses',
      description: locale === 'ar' 
        ? 'تعلم من أفضل المدربين في مجال البيانات والذكاء الاصطناعي'
        : 'Learn from the best instructors in data science and AI',
    },
    {
      icon: Users,
      title: locale === 'ar' ? 'مجتمع نشط' : 'Active Community',
      description: locale === 'ar'
        ? 'انضم إلى مجتمع من المتعلمين المتحمسين'
        : 'Join a community of passionate learners',
    },
    {
      icon: Award,
      title: locale === 'ar' ? 'شهادات معتمدة' : 'Certified Certificates',
      description: locale === 'ar'
        ? 'احصل على شهادات معتمدة عند إكمال الدورات'
        : 'Get certified certificates upon course completion',
    },
    {
      icon: PlayCircle,
      title: locale === 'ar' ? 'فيديوهات عالية الجودة' : 'High Quality Videos',
      description: locale === 'ar'
        ? 'شاهد فيديوهات عالية الجودة من مدربين محترفين'
        : 'Watch high-quality videos from professional instructors',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Navbar inside video (Vision 2030 style) */}
      <section className="relative h-[85vh] min-h-[500px] w-full overflow-hidden flex-shrink-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Black overlay for readability */}
        <div className="absolute inset-0 bg-black/45" aria-hidden />
        {/* Navbar over the video - dark background on hover */}
        <Navbar overVideo />
        <div className="relative z-10 flex h-full flex-col justify-end pb-12 md:pb-16">
          <div className="container mx-auto px-4 w-full">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8 w-full">
              {/* Button in lower-middle-left (rtl:order-2 so in Arabic it stays visual left) */}
              <div className="flex items-end justify-start order-2 lg:order-1 rtl:lg:order-2 lg:flex-shrink-0 lg:ml-20 lg:mb-2 rtl:lg:ml-0 rtl
              :lg:mr-20">
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-full border-2 border-[3px] bg-transparent px-8 py-3.5 text-lg font-medium text-white shadow-md transition-all duration-200 hover:bg-sky-400 hover:border-sky-400 hover:shadow-xl hover:text-gray-900"
                >
                  {t('exploreCourses')}
                </Link>
              </div>
              {/* Title and subtitle on the right (rtl:order-1 so in Arabic it stays visual right) */}
              <div className="max-w-5xl ml-auto -mr-4 md:-mr-6 lg:-mr-8 rtl:mr-0 rtl:ml-auto rtl:-ml-4 rtl:md:-ml-6 rtl:lg:-ml-8 flex flex-col items-end text-right shadow-2xl rounded-2xl bg-black/20 backdrop-blur-sm px-6 py-8 md:px-8 md:py-10 order-1 lg:order-2 rtl:lg:order-1">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg md:text-5xl lg:text-6xl text-right w-full">
                  {t('heroTitle')}
                </h1>
                <p className="mt-5 text-lg text-white/95 drop-shadow-md md:text-xl text-right w-full md:mt-6">
                  {t('heroSubtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Carousel */}
      <CategoriesCarousel />

      {/* Features Section - Revamped */}
      <section className="py-16 md:py-24 bg-background" aria-labelledby="features-heading">
        <div className="w-full mx-auto px-4 max-w-[1800px]">
          <header className={`mb-12 md:mb-16 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <h2 id="features-heading" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {locale === 'ar' ? 'لماذا تختار منصّة DAI؟' : 'Why choose DAI?'}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl">
              {locale === 'ar' ? 'كل ما تحتاجه لتطوير مهاراتك في البيانات والذكاء الاصطناعي' : 'Everything you need to grow your skills in data and AI'}
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <article
                  key={index}
                  className={`group relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:border-primary/20 hover:-translate-y-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Icon className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Skills / Courses Section - Revamped */}
      <section className="py-20 bg-background" aria-labelledby="courses-heading">
        <div className="w-full mx-auto px-4 max-w-[1800px]">
          <header className={`mb-10 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <h2 id="courses-heading" className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
              {locale === 'ar' ? 'مهارات تُغيّر مسارك المهني وحياتك' : 'Skills to transform your career and life'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
              {locale === 'ar'
                ? 'من المهارات الأساسية إلى المواضيع التقنية، منصّة DAI تدعم تطورك المهني.'
                : 'From critical skills to technical topics, DAI supports your professional development.'}
            </p>
          </header>

          {/* Category filters - always on the right (visual right in LTR and RTL) */}
          <div className={`flex flex-wrap gap-3 mb-8 ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary/50 hover:text-primary hover:shadow-sm'
                }`}
              >
                {locale === 'ar' ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {locale === 'ar' ? 'لا توجد دورات متاحة حالياً.' : 'No courses available at the moment.'}
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 mt-4 text-primary font-semibold hover:underline"
              >
                {locale === 'ar' ? 'استكشف المنصة' : 'Explore the platform'}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="relative mb-10 mx-4 md:mx-6 mt-6">
              <button
                type="button"
                onClick={() => scrollCarousel('prev')}
                disabled={carouselAtStart}
                aria-label={locale === 'ar' ? 'السابق' : 'Previous'}
                className={`${btnBase} ${prevBtnPos} ${prevDisabled}`}
              >
                {isRTL ? <ChevronRight className="h-6 w-6" aria-hidden /> : <ChevronLeft className="h-6 w-6" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('next')}
                disabled={carouselAtEnd}
                aria-label={locale === 'ar' ? 'التالي' : 'Next'}
                className={`${btnBase} ${nextBtnPos} ${nextDisabled}`}
              >
                {isRTL ? <ChevronLeft className="h-6 w-6" aria-hidden /> : <ChevronRight className="h-6 w-6" aria-hidden />}
              </button>
              <div
                key={selectedCategory}
                ref={carouselRef}
                className="overflow-x-auto scrollbar-hide pt-4 pb-4 -mx-4 px-4 flex gap-4 scroll-smooth snap-x snap-mandatory [direction:rtl]"
                style={{ gap: CARD_GAP }}
              >
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex-shrink-0 snap-start"
                    style={{ width: CARD_WIDTH }}
                  >
                    <CourseCard course={course} locale={locale} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`flex ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-6 py-3 font-semibold shadow-md hover:bg-primary/90 hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {locale === 'ar' ? 'عرض جميع الدورات' : 'Show all courses'}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="inline-block mb-4">
                <NextImage src="/logo.png" alt="DAi" width={100} height={34} className="h-8 w-auto object-contain opacity-90" />
              </Link>
              <p className="text-gray-400">
                {locale === 'ar'
                  ? 'منصة تعليمية متخصصة في علوم البيانات والذكاء الاصطناعي'
                  : 'Educational platform specialized in data science and AI'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('courses')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{locale === 'ar' ? 'جميع الدورات' : 'All Courses'}</li>
                <li>{locale === 'ar' ? 'دورات مجانية' : 'Free Courses'}</li>
                <li>{locale === 'ar' ? 'دورات مدفوعة' : 'Paid Courses'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('about')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{locale === 'ar' ? 'من نحن' : 'About Us'}</li>
                <li>{locale === 'ar' ? 'فريق العمل' : 'Our Team'}</li>
                <li>{locale === 'ar' ? 'الشراكات' : 'Partnerships'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('contact')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{locale === 'ar' ? 'اتصل بنا' : 'Contact Us'}</li>
                <li>{locale === 'ar' ? 'الدعم الفني' : 'Support'}</li>
                <li>{locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 DAI Platform. {locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
