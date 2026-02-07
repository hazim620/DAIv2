'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CourseCard({ course, locale, className, onNavigate }) {
  const title =
    typeof course.title === 'object'
      ? course.title[locale] || course.title.en || course.title.ar
      : course.title
  const shortDesc =
    course.shortDescription ||
    (typeof course.description === 'object'
      ? course.description?.[locale] || course.description?.en
      : course.description) ||
    ''
  const desc = shortDesc.length > 100 ? shortDesc.slice(0, 100) + '…' : shortDesc
  const hasValidThumbnail =
    course.thumbnail &&
    (course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/'))

  return (
    <Link
      href={`/courses/${course.id}/preview`}
      className={cn('block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg', className)}
      onClick={onNavigate}
    >
      <Card className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {hasValidThumbnail ? (
            <NextImage
              src={course.thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
              <PlayCircle className="h-10 w-10 text-primary/40" />
            </div>
          )}
        </div>
        <CardHeader className="p-3">
          <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">
            {title}
          </CardTitle>
          {desc && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{desc}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mt-2">
            {course.level && <span>{course.level}</span>}
            {course.duration && (
              <>
                <span aria-hidden>·</span>
                <span>{course.duration}</span>
              </>
            )}
            {course.rating != null && (
              <>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-0.5" aria-label={`Rating ${course.rating}`}>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {Number(course.rating).toFixed(1)}
                </span>
              </>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
