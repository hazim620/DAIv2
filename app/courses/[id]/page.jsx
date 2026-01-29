'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { PlayCircle, Lock, CheckCircle, Clock, Star, HelpCircle, MessageSquare, FileQuestion, BookOpen, File } from 'lucide-react'
import { formatVideoDuration } from '@/lib/utils'
import { CourseReviews } from '@/components/course-reviews'
import { CourseQA } from '@/components/course-qa'
import { CourseDiscussions } from '@/components/course-discussions'

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
  const [activeTab, setActiveTab] = useState('content')

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

  const isInstructorOrAdmin = user && course && (course.instructorId === user.id || user.role === 'admin')

  const handleVideoClick = (video) => {
    if (video.isFree || enrollment || isInstructorOrAdmin) {
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

  const totalVideos = course.sections.reduce((sum, section) => sum + (section.videos || []).length, 0)
  const freeVideos = course.sections.reduce(
    (sum, section) => sum + (section.videos || []).filter(v => v.isFree).length,
    0
  )

  // Merge section contents in order (videos, quizzes, articles, pdfs) for display
  const getSectionContents = (section) => {
    let orderIndex = 0
    const videos = (section.videos || []).map(v => ({ ...v, type: 'video', order: v.order !== undefined ? v.order : orderIndex++ }))
    const quizzes = (section.quizzes || []).map(q => ({ ...q, type: 'quiz', order: q.order !== undefined ? q.order : orderIndex++ }))
    const articles = (section.articles || []).map(a => ({ ...a, type: 'article', order: a.order !== undefined ? a.order : orderIndex++ }))
    const pdfs = (section.pdfs || []).map(p => ({ ...p, type: 'pdf', order: p.order !== undefined ? p.order : orderIndex++ }))
    return [...videos, ...quizzes, ...articles, ...pdfs].sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const getContentTitle = (content) => {
    if (!content) return ''
    const t = content.title
    return typeof t === 'object' ? (t[locale] || t.en || '') : (t || '')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header - Always Visible */}
              <Card>
                <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="h-24 w-24 text-primary/50" />
                  )}
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

              {/* Tabs */}
              <div className="border-b">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                      activeTab === 'content'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {locale === 'ar' ? 'المحتوى' : 'Content'}
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-4 px-4 font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'reviews'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Star className="h-4 w-4" />
                    {locale === 'ar' ? 'التقييمات' : 'Reviews'}
                  </button>
                  <button
                    onClick={() => setActiveTab('qa')}
                    className={`pb-4 px-4 font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'qa'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    {locale === 'ar' ? 'الأسئلة والأجوبة' : 'Q&A'}
                  </button>
                  <button
                    onClick={() => setActiveTab('discussions')}
                    className={`pb-4 px-4 font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'discussions'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {locale === 'ar' ? 'المناقشات' : 'Discussions'}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'content' && (
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
                          {getSectionContents(section).map((content) => {
                            if (content.type === 'video') {
                              const video = content
                              const canWatch = video.isFree || enrollment || isInstructorOrAdmin
                              const isWatched = enrollment?.completedVideos?.includes(video.id.toString())
                              return (
                                <div
                                  key={video.id}
                                  className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                                    canWatch ? 'hover:bg-gray-50 border-gray-200' : 'opacity-60 border-gray-300'
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
                                      <p className="font-medium">{getContentTitle(video)}</p>
                                      <p className="text-sm text-gray-500">{formatVideoDuration(video.duration)}</p>
                                    </div>
                                    {video.isFree && (
                                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        {t('free')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            }
                            if (content.type === 'quiz') {
                              return (
                                <div key={content.id} className="flex items-center gap-3 p-3 rounded border border-gray-200 bg-gray-50">
                                  <FileQuestion className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                  <p className="font-medium">{getContentTitle(content)}</p>
                                  <span className="text-xs text-gray-500 ml-auto">{locale === 'ar' ? 'اختبار' : 'Quiz'}</span>
                                </div>
                              )
                            }
                            if (content.type === 'article') {
                              return (
                                <div key={content.id} className="flex items-start gap-3 p-3 rounded border border-gray-200 bg-gray-50">
                                  <BookOpen className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium">{getContentTitle(content)}</p>
                                    {content.content && (
                                      <div
                                        className="text-sm text-gray-600 mt-1 line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: content.content }}
                                      />
                                    )}
                                    <span className="text-xs text-gray-500">{locale === 'ar' ? 'مقال' : 'Article'}</span>
                                  </div>
                                </div>
                              )
                            }
                            if (content.type === 'pdf') {
                              const pdfUrl = content.url ?? content.file
                              return (
                                <div key={content.id} className="flex items-center gap-3 p-3 rounded border border-gray-200 bg-gray-50">
                                  <File className="h-5 w-5 text-red-600 flex-shrink-0" />
                                  {pdfUrl ? (
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary hover:underline"
                                    >
                                      {getContentTitle(content)}
                                    </a>
                                  ) : (
                                    <p className="font-medium">{getContentTitle(content)}</p>
                                  )}
                                  <span className="text-xs text-gray-500 ml-auto">{locale === 'ar' ? 'ملف' : 'File'}</span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              )}

              {activeTab === 'reviews' && (
                <CourseReviews courseId={courseId} />
              )}

              {activeTab === 'qa' && (
                <CourseQA courseId={courseId} instructorId={course?.instructorId} />
              )}

              {activeTab === 'discussions' && (
                <CourseDiscussions courseId={courseId} />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  {isInstructorOrAdmin ? (
                    <>
                      <CardTitle className="text-xl">
                        {locale === 'ar' ? 'عرض الدورة' : 'View Course'}
                      </CardTitle>
                      <CardDescription>
                        {locale === 'ar' ? 'أنت مدرب هذه الدورة — عرض المحتوى بدون تسجيل' : 'You teach this course — view content without enrolling'}
                      </CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-2xl">${course.price}</CardTitle>
                      <CardDescription>
                        {locale === 'ar' ? 'سعر الدورة' : 'Course Price'}
                      </CardDescription>
                    </>
                  )}
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
                    {enrollment && !isInstructorOrAdmin && (
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
                    {isInstructorOrAdmin ? (
                      <Link href={course.sections[0]?.videos[0]?.id ? `/courses/${courseId}/${course.sections[0].videos[0].id}` : '#'}>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                          {locale === 'ar' ? 'عرض المحتوى' : 'View Content'}
                        </Button>
                      </Link>
                    ) : enrollment ? (
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
                  {!isInstructorOrAdmin && (
                    <p className="text-xs text-center text-gray-500">
                      {locale === 'ar'
                        ? 'يمكنك مشاهدة الفيديو الأول مجاناً'
                        : 'You can watch the first video for free'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
