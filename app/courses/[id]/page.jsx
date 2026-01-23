'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { PlayCircle, Lock, CheckCircle, Clock } from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const courseId = params.id
  const [course, setCourse] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchCourse()
    if (user) {
      fetchEnrollment()
    }
  }, [courseId, user])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}?locale=${locale}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCourse(data.course)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollment = async () => {
    try {
      const response = await fetch('/api/enrollments', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const found = data.enrollments.find(e => e.courseId === courseId.toString())
        setEnrollment(found)
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setEnrolling(true)
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollment(data.enrollment)
        // Redirect to first video
        if (course && course.sections.length > 0 && course.sections[0].videos.length > 0) {
          router.push(`/courses/${courseId}/${course.sections[0].videos[0].id}`)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      alert('Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  const handleVideoClick = (video) => {
    if (video.isFree || enrollment) {
      router.push(`/courses/${courseId}/${video.id}`)
    } else {
      alert(
        locale === 'ar'
          ? 'يرجى التسجيل في الدورة لمشاهدة هذا الفيديو'
          : 'Please enroll in the course to watch this video'
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">{locale === 'ar' ? 'الدورة غير موجودة' : 'Course not found'}</p>
            <Link href="/courses">
              <Button className="mt-4">{locale === 'ar' ? 'العودة للدورات' : 'Back to Courses'}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVideos = course.sections.reduce((sum, section) => sum + section.videos.length, 0)
  const freeVideos = course.sections.reduce(
    (sum, section) => sum + section.videos.filter(v => v.isFree).length,
    0
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <PlayCircle className="h-24 w-24 text-primary/50" />
                </div>
                <CardHeader>
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div>
                      <span>{locale === 'ar' ? 'المدرب:' : 'Instructor:'} </span>
                      <span className="font-medium">{course.instructor}</span>
                    </div>
                    <div>
                      <span>{totalVideos} {t('videos')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Sections */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('sections')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.sections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">{section.title}</h3>
                        <div className="space-y-2">
                          {section.videos.map((video) => {
                            const canWatch = video.isFree || enrollment
                            const isWatched = enrollment?.completedVideos?.includes(video.id.toString())

                            return (
                              <div
                                key={video.id}
                                className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                                  canWatch
                                    ? 'hover:bg-gray-50 border-gray-200'
                                    : 'opacity-60 border-gray-300'
                                }`}
                                onClick={() => handleVideoClick(video)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {canWatch ? (
                                    isWatched ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <PlayCircle className="h-5 w-5 text-primary" />
                                    )
                                  ) : (
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="font-medium">{video.title}</p>
                                    <p className="text-sm text-gray-500">{video.duration}</p>
                                  </div>
                                  {video.isFree && (
                                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {t('free')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-2xl">${course.price}</CardTitle>
                  <CardDescription>
                    {locale === 'ar' ? 'سعر الدورة' : 'Course Price'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('videos')}</span>
                      <span className="font-medium">{totalVideos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {locale === 'ar' ? 'فيديوهات مجانية' : 'Free Videos'}
                      </span>
                      <span className="font-medium">{freeVideos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {locale === 'ar' ? 'المدة' : 'Duration'}
                      </span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                    {enrollment && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-2">
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
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    {enrollment ? (
                      <Link href={`/courses/${courseId}/${course.sections[0]?.videos[0]?.id || ''}`}>
                        <Button className="w-full">
                          {locale === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" onClick={handleEnroll} disabled={enrolling}>
                        {enrolling ? t('loading') : t('enrollNow')}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-center text-gray-500">
                    {locale === 'ar'
                      ? 'يمكنك مشاهدة الفيديو الأول مجاناً'
                      : 'You can watch the first video for free'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
