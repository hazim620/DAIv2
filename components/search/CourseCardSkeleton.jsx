'use client'

import { cn } from '@/lib/utils'

export function CourseCardSkeleton({ className }) {
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-white border border-gray-200 p-0',
        className
      )}
      role="presentation"
      aria-hidden
    >
      <div className="aspect-video bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
