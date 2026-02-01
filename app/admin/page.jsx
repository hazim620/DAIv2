'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen, Plus, Trash2, Edit, Users, TrendingUp, MessageSquare, Star, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [reviews, setReviews] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [performanceCourses, setPerformanceCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', category: '' })
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    instructor: '',
    duration: '',
    price: '',
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    fetchData()
  }, [user, locale])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    fetchDashboard()
  }, [user, filters.dateFrom, filters.dateTo, filters.category])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    if (activeTab === 'performance') fetchPerformance()
  }, [user, activeTab])

  const fetchDashboard = async () => {
    try {
      const q = new URLSearchParams()
      if (filters.dateFrom) q.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) q.set('dateTo', filters.dateTo)
      if (filters.category) q.set('category', filters.category)
      const res = await fetch(`/api/admin/dashboard?${q}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    }
  }

  const fetchPerformance = async () => {
    try {
      const res = await fetch('/api/admin/courses/performance', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPerformanceCourses(data.courses || [])
      }
    } catch (e) {
      console.error('Performance fetch error:', e)
    }
  }

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes, reviewsRes] = await Promise.all([
        fetch(`/api/courses?locale=${locale}`, { credentials: 'include' }),
        fetch('/api/enrollments', { credentials: 'include' }),
        fetch('/api/reviews?courseId=all', { credentials: 'include' }).catch(() => ({ ok: false })),
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
      }

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json()
        setEnrollments(data.enrollments || [])
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json()
        setReviews(data.reviews || [])
      }

      await fetchDashboard()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          students: 0,
          sections: [],
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          title: { en: '', ar: '' },
          description: { en: '', ar: '' },
          instructor: '',
          duration: '',
          price: '',
        })
        fetchData()
      } else {
        alert('Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Error creating course')
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الدورة؟' : 'Are you sure you want to delete this course?')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchData()
        alert(locale === 'ar' ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Error deleting course')
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const totalCourses = dashboard?.totalCourses ?? courses.length
  const totalEnrollments = dashboard?.totalStudents ?? enrollments.length
  const totalGrossRevenue = dashboard?.totalGrossRevenue ?? 0
  const totalNetRevenue = dashboard?.totalNetRevenue ?? 0
  const totalInstructors = dashboard?.totalInstructors ?? 0
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div className="flex-1 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {locale === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar' ? 'نظرة عامة على المنصة' : 'Platform overview'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="w-40"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="border rounded px-3 py-2 w-44 text-sm"
          >
            <option value="">{locale === 'ar' ? 'كل التصنيفات' : 'All categories'}</option>
            <option value="general">{locale === 'ar' ? 'عام' : 'General'}</option>
            <option value="programming">{locale === 'ar' ? 'برمجة' : 'Programming'}</option>
            <option value="business">{locale === 'ar' ? 'أعمال' : 'Business'}</option>
            <option value="marketing">{locale === 'ar' ? 'تسويق' : 'Marketing'}</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'إجمالي الإيرادات' : 'Gross Revenue'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{totalGrossRevenue.toLocaleString()} ر.س</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'صافي الإيرادات' : 'Net Revenue'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{totalNetRevenue.toLocaleString()} ر.س</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'الدورات' : 'Courses'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{totalCourses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'المعلمون' : 'Instructors'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{totalInstructors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'الطلاب' : 'Students'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{totalEnrollments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'أداء الدورات' : 'Course Performance'}
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'الدورات' : 'Courses'}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'التقييمات' : 'Reviews'}
            </button>
          </div>
        </div>

          {/* Overview Tab: quick links + courses */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex gap-3 flex-wrap">
                <Link href="/admin/courses/review">
                  <Button variant="outline">
                    {locale === 'ar' ? 'مراجعة الدورات المقدمة' : 'Course Review Queue'}
                  </Button>
                </Link>
                <Link href="/admin/instructors">
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'إدارة المعلمين' : 'Manage Instructors'}
                  </Button>
                </Link>
                <Button onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'إضافة دورة' : 'Add Course'}
                </Button>
              </div>
            </div>
          )}

          {/* Course Performance Tab */}
          {activeTab === 'performance' && (
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
                  {performanceCourses.map((c) => (
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
              {performanceCourses.length === 0 && (
                <p className="text-gray-500 py-6 text-center">
                  {locale === 'ar' ? 'لا توجد دورات' : 'No courses'}
                </p>
              )}
            </div>
          )}

          {/* Course Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'إضافة دورة جديدة' : 'Add New Course'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (English)</Label>
                      <Input
                        value={formData.title.en}
                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (Arabic)</Label>
                      <Input
                        value={formData.title.ar}
                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ar: e.target.value } })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (English)</Label>
                      <Input
                        value={formData.description.en}
                        onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Arabic)</Label>
                      <Input
                        value={formData.description.ar}
                        onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ar: e.target.value } })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{locale === 'ar' ? 'المدرب' : 'Instructor'}</Label>
                      <Input
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{locale === 'ar' ? 'المدة' : 'Duration'}</Label>
                      <Input
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="10 hours"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{locale === 'ar' ? 'السعر' : 'Price'}</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{locale === 'ar' ? 'إنشاء' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const courseTitle = typeof course.title === 'object' 
                  ? course.title[locale] || course.title.en 
                  : course.title
                const enrollmentsForCourse = enrollments.filter(e => e.courseId === course.id.toString())
                const courseReviews = reviews.filter(r => r.courseId === course.id.toString())
                const avgRating = courseReviews.length > 0
                  ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1)
                  : 0

                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <CardTitle className="text-xl line-clamp-2">{courseTitle}</CardTitle>
                      <CardDescription>{course.instructor}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {locale === 'ar' ? 'السعر:' : 'Price:'} {course.price != null ? `${course.price} ر.س` : '0 ر.س'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {locale === 'ar' ? 'الطلاب:' : 'Students:'} {enrollmentsForCourse.length}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {avgRating} ({courseReviews.length} {locale === 'ar' ? 'تقييم' : 'reviews'})
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => {
                  const course = courses.find(c => c.id.toString() === review.courseId)
                  const courseTitle = course ? (typeof course.title === 'object' 
                    ? course.title[locale] || course.title.en 
                    : course.title) : 'Unknown Course'

                  return (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{courseTitle}</h3>
                            <p className="text-sm text-gray-600">
                              {review.user?.name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
      </div>
    </div>
  )
}
