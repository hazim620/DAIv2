'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { Star, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SAR = '\u20C1'

const LEVEL_LABELS = {
  beginner: { en: 'Beginner', ar: 'مبتدئ' },
  intermediate: { en: 'Intermediate', ar: 'متوسط' },
  advanced: { en: 'Advanced', ar: 'متقدم' },
}

/**
 * Premium course card with gradient border, badges, rating, and price.
 * RTL-friendly (Arabic first). Use with Next.js + Tailwind + shadcn/ui.
 *
 * @param {Object} course - Course data
 * @param {string|{en?: string, ar?: string}} course.title
 * @param {string} [course.instructor]
 * @param {string} [course.thumbnail] - URL
 * @param {number} [course.price] - 0 for free
 * @param {number} [course.originalPrice] - for strikethrough
 * @param {string} [course.duration]
 * @param {string} [course.level] - 'beginner' | 'intermediate' | 'advanced'
 * @param {number} [course.rating]
 * @param {number} [course.ratingCount]
 * @param {number} [course.students]
 * @param {string} locale - 'ar' | 'en'
 * @param {string} [className]
 * @param {string} [href] - override link
 * @param {Function} [onClick] - e.g. close search modal
 */
export function CourseCard({ course, locale = 'ar', className, href, onClick }) {
  const title =
    typeof course.title === 'object'
      ? course.title[locale] || course.title.en || course.title.ar || ''
      : course.title || ''

  const instructor = course.instructor || (locale === 'ar' ? 'مدرب' : 'Instructor')
  const price = course.price != null ? Number(course.price) : 0
  const isFree = price === 0
  const originalPrice =
    course.originalPrice != null ? Number(course.originalPrice) : null
  const levelLabel =
    course.level && LEVEL_LABELS[course.level.toLowerCase()]
      ? LEVEL_LABELS[course.level.toLowerCase()][locale]
      : null
  const rating =
    course.rating != null ? Number(course.rating) : null
  const ratingCount = course.ratingCount != null ? Number(course.ratingCount) : null

  const hasValidThumbnail =
    course.thumbnail &&
    (course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/'))

  const linkHref = href ?? `/courses/${course.id}/preview`
  const isRTL = locale === 'ar'

  return (
    <Link
      href={linkHref}
      onClick={onClick}
      className={cn(
        'block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl',
        className
      )}
    >
      <div className="rounded-2xl bg-white dark:bg-gray-800 min-h-full px-5 pt-5 pb-6 flex flex-col border-2 border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:border-gray-300 dark:group-hover:border-gray-600">
          {/* Image - centered in card with space from border (taller aspect) */}
          <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 shrink-0 min-h-[200px]">
            {hasValidThumbnail ? (
              <NextImage
                src={course.thumbnail}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600">
                <PlayCircle className="h-14 w-14 text-slate-400 dark:text-gray-500" aria-hidden />
              </div>
            )}

            {/* Level badge - top end (right in LTR, left in RTL) */}
            {levelLabel && (
              <span
                className={cn(
                  'absolute top-2 px-2 py-0.5 rounded-md text-xs font-medium',
                  'bg-black/50 text-white backdrop-blur-sm',
                  isRTL ? 'left-2' : 'right-2'
                )}
              >
                {levelLabel}
              </span>
            )}

            {/* Duration badge - bottom start */}
            {course.duration && (
              <span
                className={cn(
                  'absolute bottom-2 px-2 py-0.5 rounded-md text-xs font-medium',
                  'bg-black/50 text-white backdrop-blur-sm',
                  isRTL ? 'right-2' : 'left-2'
                )}
              >
                {course.duration}
              </span>
            )}
          </div>

          {/* Content */}
          <div
            className={cn(
              'pt-5 space-y-2.5 flex-1',
              isRTL ? 'text-right' : 'text-left'
            )}
          >
            <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug text-lg">
              {title}
            </h3>
            <p className="text-sm text-gray-500 truncate mb-4">{instructor}</p>

            {/* Rating & count tags - right for Arabic, left for English */}
            <div
              className="flex flex-wrap gap-2 justify-start"
              dir={isRTL ? 'rtl' : undefined}
            >
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium"
                aria-label={rating != null ? `${locale === 'ar' ? 'التقييم' : 'Rating'}: ${Number(rating).toFixed(1)}` : undefined}
              >
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" aria-hidden />
                {rating != null ? Number(rating).toFixed(1) : '—'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">
                {ratingCount != null && ratingCount > 0
                  ? locale === 'ar'
                    ? `${ratingCount} تقييم`
                    : `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
                  : locale === 'ar'
                    ? '0 تقييم'
                    : '0 ratings'}
              </span>
            </div>

            {/* Price - prominent for ريال visibility */}
            <div
              className={cn(
                'pt-3 border-t-2 border-gray-100 dark:border-gray-700 flex items-baseline gap-2 flex-wrap',
                isRTL && 'justify-end flex-row-reverse'
              )}
            >
              {isFree ? (
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {locale === 'ar' ? 'مجاني' : 'Free'}
                </span>
              ) : (
                <>
                  <span className="font-bold text-xl text-gray-900 dark:text-gray-100" aria-label={locale === 'ar' ? `${price.toFixed(2)} ريال سعودي` : `${price.toFixed(2)} SAR`}>
                    <span className="text-primary font-extrabold">{SAR}</span>
                    <span className="ml-0.5 rtl:ml-0 rtl:mr-0.5">{price.toFixed(2)}</span>
                  </span>
                  {originalPrice != null && originalPrice > price && (
                    <span className="text-base text-gray-400 dark:text-gray-500 line-through">
                      {SAR} {originalPrice.toFixed(2)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
    </Link>
  )
}
