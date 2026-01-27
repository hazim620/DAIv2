'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart3, Download, TrendingUp, Users, DollarSign } from 'lucide-react'

export function AnalyticsTab({ locale }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    courseId: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchAnalytics()
  }, [filters])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.courseId) params.append('courseId', filters.courseId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const res = await fetch(`/api/instructor/analytics?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!analytics) return

    const csvRows = []
    csvRows.push('Course,Enrollments,Revenue,Completion Rate')
    analytics.courseBreakdown.forEach(course => {
      csvRows.push(`${course.courseTitle},${course.enrollments},${course.revenue},${course.completionRate}%`)
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'الفلاتر' : 'Filters'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>{locale === 'ar' ? 'الدورة' : 'Course'}</Label>
              <Input
                value={filters.courseId}
                onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                placeholder={locale === 'ar' ? 'معرف الدورة' : 'Course ID'}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'من تاريخ' : 'Start Date'}</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'إلى تاريخ' : 'End Date'}</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={exportCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'إجمالي التسجيلات' : 'Total Enrollments'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalEnrollments || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(analytics.totalRevenue || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'متوسط معدل الإكمال' : 'Avg Completion Rate'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.courseBreakdown.length > 0
                    ? Math.round(
                        analytics.courseBreakdown.reduce((sum, c) => sum + c.completionRate, 0) /
                        analytics.courseBreakdown.length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'تفصيل حسب الدورة' : 'Course Breakdown'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{locale === 'ar' ? 'الدورة' : 'Course'}</th>
                      <th className="text-left p-2">{locale === 'ar' ? 'التسجيلات' : 'Enrollments'}</th>
                      <th className="text-left p-2">{locale === 'ar' ? 'الإيرادات' : 'Revenue'}</th>
                      <th className="text-left p-2">{locale === 'ar' ? 'معدل الإكمال' : 'Completion Rate'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.courseBreakdown.map((course, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{course.courseTitle}</td>
                        <td className="p-2">{course.enrollments}</td>
                        <td className="p-2">${course.revenue.toLocaleString()}</td>
                        <td className="p-2">{course.completionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
