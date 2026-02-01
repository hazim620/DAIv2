'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen } from 'lucide-react'

export default function AdminCoursePerformancePage() {
  const { locale } = useLanguage()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('revenue')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = new URLSearchParams()
        if (sortBy) q.set('sortBy', sortBy)
        if (category) q.set('category', category)
        const res = await fetch(`/api/admin/courses/performance?${q}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setCourses(data.courses || [])
        }
      } catch (e) {
        console.error('Fetch performance error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [sortBy, category])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {locale === 'ar' ? 'أداء الدورات' : 'Course Performance'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar' ? 'إيرادات وتسجيل حسب الدورة' : 'Revenue and enrollments per course'}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="revenue">{locale === 'ar' ? 'الإيرادات' : 'Revenue'}</option>
            <option value="enrollments">{locale === 'ar' ? 'التسجيلات' : 'Enrollments'}</option>
            <option value="status">{locale === 'ar' ? 'الحالة' : 'Status'}</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">{locale === 'ar' ? 'كل التصنيفات' : 'All categories'}</option>
            <option value="general">{locale === 'ar' ? 'عام' : 'General'}</option>
            <option value="programming">{locale === 'ar' ? 'برمجة' : 'Programming'}</option>
            <option value="business">{locale === 'ar' ? 'أعمال' : 'Business'}</option>
            <option value="marketing">{locale === 'ar' ? 'تسويق' : 'Marketing'}</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">
                {locale === 'ar' ? 'الدورة' : 'Course'}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">
                {locale === 'ar' ? 'المدرب' : 'Instructor'}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-right font-medium">
                {locale === 'ar' ? 'الطلاب' : 'Enrolled'}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-right font-medium">
                {locale === 'ar' ? 'إجمالي الإيرادات' : 'Gross Revenue'}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-right font-medium">
                {locale === 'ar' ? 'صافي المنصة' : 'Net Platform'}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">
                {locale === 'ar' ? 'الحالة' : 'Status'}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium" />
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 font-medium">{c.title || c.id}</td>
                <td className="border border-gray-200 px-3 py-2">{c.instructorName || '-'}</td>
                <td className="border border-gray-200 px-3 py-2 text-right">{c.enrolledCount}</td>
                <td className="border border-gray-200 px-3 py-2 text-right">{c.grossRevenue?.toLocaleString()} ر.س</td>
                <td className="border border-gray-200 px-3 py-2 text-right">{c.netPlatformRevenue?.toLocaleString()} ر.س</td>
                <td className="border border-gray-200 px-3 py-2">{c.status || '-'}</td>
                <td className="border border-gray-200 px-3 py-2">
                  <Link href={`/admin/courses/${c.id}/review`}>
                    <Button variant="outline" size="sm">
                      {locale === 'ar' ? 'عرض' : 'View'}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <p className="text-gray-500 py-6 text-center">
            {locale === 'ar' ? 'لا توجد دورات' : 'No courses'}
          </p>
        )}
      </div>
    </div>
  )
}
