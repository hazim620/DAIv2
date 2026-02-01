'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { 
  BookOpen, Users, TrendingUp, Award, Edit, Plus, Trash2,
  FileText, MessageSquare, Bell, BarChart3,
  CheckCircle, Clock, AlertCircle, XCircle
} from 'lucide-react'
import { AnalyticsTab } from '@/components/instructor/analytics-tab'

export default function InstructorDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [dashboardData, setDashboardData] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [discountCodes, setDiscountCodes] = useState([])
  const [discountForm, setDiscountForm] = useState({ code: '', discountPercent: 10, startDate: '', endDate: '', maxUses: '' })
  const [discountCreateLoading, setDiscountCreateLoading] = useState(false)
  const [discountCreateError, setDiscountCreateError] = useState('')
  const [discountCreateSuccess, setDiscountCreateSuccess] = useState('')
  const [discountDeletingId, setDiscountDeletingId] = useState(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchDashboardData()
    fetchCourses()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/instructor/dashboard', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/instructor/courses', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleDeleteDraft = async (courseId, courseTitle) => {
    if (!confirm(locale === 'ar' ? `هل أنت متأكد من حذف الدورة "${courseTitle}"؟` : `Are you sure you want to delete "${courseTitle}"?`)) {
      return
    }
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        fetchCourses()
      } else {
        const data = await res.json()
        alert(data.error || (locale === 'ar' ? 'فشل الحذف' : 'Delete failed'))
      }
    } catch (e) {
      alert('Network error')
    }
  }

  const fetchDiscountCodes = async () => {
    try {
      const res = await fetch('/api/instructor/discounts', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDiscountCodes(data.codes || [])
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'discounts' && user) fetchDiscountCodes()
  }, [activeTab, user])

  const handleCreateDiscount = async (e) => {
    e.preventDefault()
    setDiscountCreateError('')
    setDiscountCreateSuccess('')
    if (!discountForm.code.trim()) {
      setDiscountCreateError(locale === 'ar' ? 'كود الخصم مطلوب' : 'Code is required')
      return
    }
    if (!discountForm.startDate || !discountForm.endDate) {
      setDiscountCreateError(locale === 'ar' ? 'تاريخ البداية والنهاية مطلوبان' : 'Start and end date are required')
      return
    }
    setDiscountCreateLoading(true)
    try {
      const res = await fetch('/api/instructor/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: discountForm.code.trim(),
          discountPercent: Number(discountForm.discountPercent) || 10,
          startDate: discountForm.startDate,
          endDate: discountForm.endDate,
          maxUses: discountForm.maxUses === '' ? null : (Number(discountForm.maxUses) || null),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setDiscountCreateSuccess(locale === 'ar' ? 'تم إنشاء الكود بنجاح' : 'Code created successfully')
        setDiscountForm({ code: '', discountPercent: 10, startDate: '', endDate: '', maxUses: '' })
        fetchDiscountCodes()
      } else {
        setDiscountCreateError(data.error || (locale === 'ar' ? 'فشل إنشاء الكود' : 'Failed to create code'))
      }
    } catch (err) {
      setDiscountCreateError(locale === 'ar' ? 'خطأ في الشبكة' : 'Network error')
    } finally {
      setDiscountCreateLoading(false)
    }
  }

  const handleDeleteDiscount = async (id) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الكود؟' : 'Are you sure you want to delete this discount code?')) {
      return
    }
    setDiscountDeletingId(id)
    try {
      const res = await fetch(`/api/instructor/discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setDiscountCodes((prev) => prev.filter((c) => c.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || (locale === 'ar' ? 'فشل الحذف' : 'Delete failed'))
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setDiscountDeletingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { icon: FileText, color: 'bg-gray-100 text-gray-800', labelAr: 'مسودة', labelEn: 'Draft' },
      submitted_for_review: { icon: Clock, color: 'bg-blue-100 text-blue-800', labelAr: 'تحت المراجعة', labelEn: 'Under Review' },
      need_modification: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', labelAr: 'مطلوب تعديلات', labelEn: 'Modifications Requested' },
      changes_requested: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', labelAr: 'يُطلب تعديلات', labelEn: 'Changes Requested' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', labelAr: 'مرفوض', labelEn: 'Rejected' },
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', labelAr: 'معتمد', labelEn: 'Approved' },
      published: { icon: CheckCircle, color: 'bg-green-100 text-green-800', labelAr: 'منشور', labelEn: 'Published' },
    }
    const badge = badges[status] || badges.draft
    const Icon = badge.icon
    const label = locale === 'ar' ? (badge.labelAr || badge.labelEn) : (badge.labelEn || badge.labelAr)
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    )
  }

  if (loading || !user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const summary = dashboardData?.summary || {}
  const recentNotifications = dashboardData?.recentNotifications || []

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {locale === 'ar' ? 'لوحة تحكم المدرب' : 'Instructor Panel'}
                </h1>
                <p className="text-gray-600">
                  {locale === 'ar'
                    ? 'إدارة دوراتك ومراقبة أداء الطلاب'
                    : 'Manage your courses and monitor student performance'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/instructor/courses/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'courses'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'الدورات' : 'Courses'}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'التحليلات' : 'Analytics'}
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'discounts'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'الخصومات' : 'Discounts'}
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {locale === 'ar' ? 'إجمالي الدورات' : 'Total Courses'}
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalCourses || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {locale === 'ar' ? 'منشورة' : 'Published'}
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.publishedCourses || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {locale === 'ar' ? 'مسودات' : 'Drafts'}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.draftCourses || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {locale === 'ar' ? 'إجمالي الطلاب' : 'Total Students'}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalStudents || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(summary.totalRevenue || 0).toLocaleString()} ر.س</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {locale === 'ar' ? 'الإشعارات الأخيرة' : 'Recent Notifications'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentNotifications.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentNotifications.map((notification) => (
                        <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{notification.courseTitle}</p>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{locale === 'ar' ? 'دوراتي' : 'My Courses'}</h2>
                <Link href="/instructor/courses/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'دورة جديدة' : 'New Course'}
                  </Button>
                </Link>
              </div>

              {courses.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {locale === 'ar' ? 'لا توجد دورات' : 'No Courses Yet'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {locale === 'ar' ? 'ابدأ بإنشاء دورتك الأولى' : 'Start by creating your first course'}
                    </p>
                    <Link href="/instructor/courses/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {locale === 'ar' ? 'إنشاء دورة' : 'Create Course'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const courseTitle = typeof course.title === 'object' 
                      ? course.title[locale] || course.title.en 
                      : course.title
                    const courseDescription = typeof course.description === 'object'
                      ? course.description[locale] || course.description.en
                      : course.description

                    return (
                      <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-16 w-16 text-primary/50" />
                          )}
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(course.status)}
                          </div>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl line-clamp-2">{courseTitle}</CardTitle>
                          <CardDescription className="line-clamp-2">{courseDescription}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 flex-wrap">
                            {(course.status === 'submitted_for_review' || course.status === 'approved' || course.status === 'rejected') ? (
                              <Button variant="outline" className="flex-1 min-w-[100px] opacity-50 cursor-not-allowed" disabled>
                                <Edit className="h-4 w-4 mr-2" />
                                {locale === 'ar' ? 'تحرير' : 'Edit'}
                              </Button>
                            ) : (
                              <Link href={`/instructor/courses/${course.id}`} className="flex-1 min-w-[100px]">
                                <Button variant="outline" className="w-full">
                                  <Edit className="h-4 w-4 mr-2" />
                                  {locale === 'ar' ? 'تحرير' : 'Edit'}
                                </Button>
                              </Link>
                            )}
                            {course.status === 'draft' && (
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteDraft(course.id, courseTitle)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {locale === 'ar' ? 'حذف' : 'Delete'}
                              </Button>
                            )}
                            <Link href={`/courses/${course.id}`} className="flex-1 min-w-[100px]">
                              <Button variant="outline" className="w-full">
                                {locale === 'ar' ? 'عرض' : 'View'}
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab locale={locale} />
          )}

          {/* Discounts Tab */}
          {activeTab === 'discounts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{locale === 'ar' ? 'أكواد الخصم' : 'Discount Codes'}</h2>
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ar' ? 'إنشاء كود خصم جديد' : 'Create new discount code'}</CardTitle>
                  <CardDescription>
                    {locale === 'ar'
                      ? 'الحد الأقصى للخصم 25%. حدد تاريخ البداية والنهاية وعدد الاستخدامات (أو لا نهائي).'
                      : 'Maximum discount 25%. Set start and end date and number of uses (or unlimited).'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateDiscount} className="space-y-4 max-w-md">
                    {discountCreateError && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{discountCreateError}</div>
                    )}
                    {discountCreateSuccess && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">{discountCreateSuccess}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'كود الخصم' : 'Code'}</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder={locale === 'ar' ? 'مثال: WELCOME25' : 'e.g. WELCOME25'}
                        maxLength={32}
                        value={discountForm.code}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, code: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'نسبة الخصم % (حد أقصى 25)' : 'Discount % (max 25)'}</label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        className="w-full px-3 py-2 border rounded-md"
                        value={discountForm.discountPercent}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, discountPercent: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'تاريخ البداية' : 'Start date'}</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-md"
                          value={discountForm.startDate}
                          onChange={(e) => setDiscountForm((f) => ({ ...f, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'تاريخ النهاية' : 'End date'}</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-md"
                          value={discountForm.endDate}
                          onChange={(e) => setDiscountForm((f) => ({ ...f, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'عدد الاستخدامات' : 'Number of uses'}</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder={locale === 'ar' ? 'فارغ = لا نهائي' : 'Empty = unlimited'}
                        value={discountForm.maxUses}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, maxUses: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">{locale === 'ar' ? 'فارغ = لا نهائي' : 'Empty = unlimited'}</p>
                    </div>
                    <Button type="submit" disabled={discountCreateLoading}>
                      {discountCreateLoading ? (locale === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (locale === 'ar' ? 'إنشاء الكود' : 'Create code')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              {discountCodes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{locale === 'ar' ? 'أكوادك' : 'Your codes'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {discountCodes.map((c) => (
                        <li key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border gap-2">
                          <span className="font-mono font-semibold">{c.code}</span>
                          <span>{c.discountPercent}%</span>
                          <span className="text-sm text-gray-600">
                            {c.startDate} – {c.endDate}
                          </span>
                          <span className="text-sm text-gray-600">
                            {c.maxUses == null ? (locale === 'ar' ? 'لا نهائي' : 'Unlimited') : `${c.usedCount || 0}/${c.maxUses}`}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                            disabled={discountDeletingId === c.id}
                            onClick={() => handleDeleteDiscount(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
