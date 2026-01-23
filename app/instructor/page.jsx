'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen, Users, TrendingUp, Award, PlayCircle, Edit, MessageSquare, Star } from 'lucide-react'

export default function InstructorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [myCourses, setMyCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [user, router, locale])

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch(`/api/courses?locale=${locale}`, { credentials: 'include' }),
        fetch('/api/enrollments', { credentials: 'include' }),
      ])

      // Fetch reviews for instructor's courses
      const myCourseIds = []
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        const filtered = coursesData.courses.filter(
          course => course.instructor === user.name || user.role === 'admin'
        )
        setMyCourses(filtered)
        myCourseIds.push(...filtered.map(c => c.id.toString()))
      }

      // Fetch reviews for instructor's courses
      const reviewsPromises = myCourseIds.map(courseId =>
        fetch(`/api/reviews?courseId=${courseId}`, { credentials: 'include' }).catch(() => ({ ok: false }))
      )
      const reviewsResults = await Promise.all(reviewsPromises)
      const allReviews = []
      for (const result of reviewsResults) {
        if (result.ok) {
          const data = await result.json()
          allReviews.push(...(data.reviews || []))
        }
      }
      setReviews(allReviews)

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData.enrollments || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
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

  // Calculate stats for instructor's courses
  const myEnrollments = enrollments.filter(e => 
    myCourses.some(course => course.id.toString() === e.courseId)
  )
  const totalStudents = myEnrollments.length

  const totalRevenue = myCourses.reduce((sum, course) => {
    const enrollmentsForCourse = enrollments.filter(e => e.courseId === course.id.toString())
    return sum + (course.price * enrollmentsForCourse.length)
  }, 0)

  const myReviews = reviews.filter(r => 
    myCourses.some(course => course.id.toString() === r.courseId)
  )
  const averageRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {locale === 'ar' ? `لوحة المدرب - ${user.name}` : `Instructor Dashboard - ${user.name}`}
            </h1>
            <p className="text-gray-600">
              {locale === 'ar'
                ? 'إدارة دوراتك ومراقبة أداء الطلاب'
                : 'Manage your courses and monitor student performance'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'دوراتي' : 'My Courses'}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myCourses.length}</div>
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
                <div className="text-2xl font-bold">{totalStudents}</div>
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
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'التقييم المتوسط' : 'Average Rating'}
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageRating} ⭐</div>
              </CardContent>
            </Card>
          </div>

          {/* My Courses */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {locale === 'ar' ? 'دوراتي' : 'My Courses'}
              </h2>
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button>
                    {locale === 'ar' ? 'إدارة الدورات' : 'Manage Courses'}
                  </Button>
                </Link>
              )}
            </div>

            {myCourses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'لا توجد دورات' : 'No Courses Yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {locale === 'ar'
                      ? 'ابدأ بإنشاء دورتك الأولى'
                      : 'Start by creating your first course'}
                  </p>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button>{locale === 'ar' ? 'إنشاء دورة' : 'Create Course'}</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((course) => {
                  const courseTitle = typeof course.title === 'object' 
                    ? course.title[locale] || course.title.en 
                    : course.title
                  const courseDescription = typeof course.description === 'object'
                    ? course.description[locale] || course.description.en
                    : course.description
                  const enrollmentsForCourse = enrollments.filter(e => e.courseId === course.id.toString())
                  const totalVideos = course.sections?.reduce(
                    (sum, section) => sum + (section.videos?.length || 0),
                    0
                  ) || 0
                  const courseReviews = reviews.filter(r => r.courseId === course.id.toString())
                  const avgRating = courseReviews.length > 0
                    ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1)
                    : 0

                  return (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <PlayCircle className="h-16 w-16 text-primary/50" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl line-clamp-2">{courseTitle}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {courseDescription}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{enrollmentsForCourse.length}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <PlayCircle className="h-4 w-4" />
                                <span>{totalVideos}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{avgRating}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${course.price}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Link href={`/courses/${course.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                {locale === 'ar' ? 'عرض' : 'View'}
                              </Button>
                            </Link>
                            {user.role === 'admin' && (
                              <Button variant="outline" className="flex-1">
                                <Edit className="h-4 w-4 mr-2" />
                                {t('edit')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Students Section */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'الطلاب المسجلين' : 'Enrolled Students'}</CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'عرض الطلاب المسجلين في دوراتك'
                  : 'View students enrolled in your courses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myCourses.map((course) => {
                  const enrollmentsForCourse = enrollments.filter(e => e.courseId === course.id.toString())
                  const courseTitle = typeof course.title === 'object' 
                    ? course.title[locale] || course.title.en 
                    : course.title

                  if (enrollmentsForCourse.length === 0) return null

                  return (
                    <div key={course.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">{courseTitle}</h3>
                      <div className="space-y-2">
                        {enrollmentsForCourse.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">
                                {locale === 'ar' ? 'طالب' : 'Student'} #{enrollment.userId}
                              </p>
                              <p className="text-sm text-gray-500">
                                {locale === 'ar' ? 'التقدم:' : 'Progress:'} {enrollment.progress || 0}%
                              </p>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {myEnrollments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {locale === 'ar' ? 'لا يوجد طلاب مسجلين بعد' : 'No students enrolled yet'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
