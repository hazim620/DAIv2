'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen, PlayCircle, Clock, TrendingUp, Award } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { locale, t } = useLanguage()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchEnrollments()
    }
  }, [user])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data.enrollments || [])
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalCourses = enrollments.length
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
  const completedCourses = enrollments.filter(e => e.progress === 100).length
  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {locale === 'ar' ? `مرحباً، ${user.name}` : `Welcome, ${user.name}`}
            </h1>
            <p className="text-gray-600">
              {locale === 'ar'
                ? 'تابع تقدمك في الدورات التعليمية'
                : 'Continue your learning journey'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'إجمالي الدورات' : 'Total Courses'}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'قيد التقدم' : 'In Progress'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'مكتملة' : 'Completed'}
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'متوسط التقدم' : 'Avg Progress'}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageProgress}%</div>
              </CardContent>
            </Card>
          </div>

          {/* My Courses */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('myCourses')}
            </h2>
            {enrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'لا توجد دورات مسجلة' : 'No enrolled courses'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {locale === 'ar'
                      ? 'ابدأ بتصفح الدورات المتاحة والتسجيل في إحداها'
                      : 'Start by browsing available courses and enroll in one'}
                  </p>
                  <Link href="/courses">
                    <Button>{t('exploreCourses')}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const course = enrollment.course
                  if (!course) return null

                  const courseTitle = typeof course.title === 'object' 
                    ? course.title[locale] || course.title.en 
                    : course.title
                  const courseDescription = typeof course.description === 'object'
                    ? course.description[locale] || course.description.en
                    : course.description

                  return (
                    <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <PlayCircle className="h-16 w-16 text-primary/50" />
                        {enrollment.progress === 100 && (
                          <div className="absolute top-2 right-2">
                            <Award className="h-6 w-6 text-yellow-500" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl line-clamp-2">{courseTitle}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {courseDescription}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {locale === 'ar' ? 'التقدم' : 'Progress'}
                              </span>
                              <span className="font-medium">{enrollment.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              />
                            </div>
                          </div>
                          <Link href={`/courses/${enrollment.courseId}`}>
                            <Button className="w-full">
                              {locale === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
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
        </div>
      </div>
    </div>
  )
}
