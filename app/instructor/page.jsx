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
  BookOpen, Users, TrendingUp, Award, Edit, Plus, 
  FileText, MessageSquare, Bell, Settings, BarChart3,
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

  const getStatusBadge = (status) => {
    const badges = {
      draft: { icon: FileText, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted_for_review: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      changes_requested: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Changes Requested' },
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
      published: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Published' },
    }
    const badge = badges[status] || badges.draft
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
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
  const statusBreakdown = dashboardData?.statusBreakdown || {}
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
                <Link href="/instructor/settings">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'الإعدادات' : 'Settings'}
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
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'students'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {locale === 'ar' ? 'الطلاب' : 'Students'}
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
                    <div className="text-2xl font-bold">${(summary.totalRevenue || 0).toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Course Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ar' ? 'حالة الدورات' : 'Course Status Breakdown'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{statusBreakdown.draft || 0}</div>
                      <div className="text-sm text-gray-600 mt-1">Draft</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold">{statusBreakdown.submitted_for_review || 0}</div>
                      <div className="text-sm text-gray-600 mt-1">Under Review</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold">{statusBreakdown.changes_requested || 0}</div>
                      <div className="text-sm text-gray-600 mt-1">Changes Requested</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold">{statusBreakdown.approved || 0}</div>
                      <div className="text-sm text-gray-600 mt-1">Approved</div>
                    </div>
                    <div className="text-center p-4 bg-green-100 rounded-lg">
                      <div className="text-2xl font-bold">{statusBreakdown.published || 0}</div>
                      <div className="text-sm text-gray-600 mt-1">Published</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                          <div className="flex gap-2">
                            <Link href={`/instructor/courses/${course.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                <Edit className="h-4 w-4 mr-2" />
                                {locale === 'ar' ? 'تحرير' : 'Edit'}
                              </Button>
                            </Link>
                            <Link href={`/courses/${course.id}`} className="flex-1">
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

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">{locale === 'ar' ? 'الطلاب' : 'Students'}</h2>
              <Link href="/instructor/students">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="py-6 text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="font-medium">
                      {locale === 'ar' ? 'عرض جميع الطلاب' : 'View All Students'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}
