'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { ClipboardList, BookOpen, User } from 'lucide-react'

export default function AdminCourseReviewPage() {
  const { locale } = useLanguage()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/admin/courses/submissions', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setSubmissions(data.submissions || [])
        }
      } catch (e) {
        console.error('Fetch submissions error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {locale === 'ar' ? 'مراجعة الدورات' : 'Course Review'}
        </h1>
        <p className="text-gray-600">
          {locale === 'ar' ? 'الدورات المقدمة للمراجعة والموافقة' : 'Courses submitted for review and approval'}
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {locale === 'ar' ? 'لا توجد دورات قيد المراجعة' : 'No courses pending review'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <Card key={s.courseId}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <BookOpen className="h-5 w-5 text-gray-500 shrink-0" />
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{s.title || s.courseId}</CardTitle>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <User className="h-4 w-4 shrink-0" />
                      {s.instructorName || '-'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span>{locale === 'ar' ? 'تاريخ التقديم:' : 'Submitted:'} {s.submittedAt ? new Date(s.submittedAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en') : '-'}</span>
                      {s.version > 1 && <span>• {locale === 'ar' ? 'الإصدار' : 'Version'} {s.version}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {s.isUpdate && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {locale === 'ar' ? 'تحديث لدورة منشورة' : 'Update to published course'}
                    </span>
                  )}
                  <Link href={`/admin/courses/${s.courseId}/review`}>
                    <Button>{locale === 'ar' ? 'مراجعة' : 'Review'}</Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
