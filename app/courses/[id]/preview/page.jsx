'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, PlayCircle, Lock, FileQuestion, BookOpen, File, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import { formatVideoDuration } from '@/lib/utils'

export default function CoursePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id
  const { user, loading: authLoading } = useAuth()
  const { locale, t } = useLanguage()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedArticleId, setExpandedArticleId] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      router.push('/login')
      return
    }
    fetchCourse()
  }, [user, authLoading, router, courseId, locale])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}?locale=${locale}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{locale === 'ar' ? 'الدورة غير موجودة' : 'Course not found'}</p>
      </div>
    )
  }

  const courseTitle = typeof course.title === 'object'
    ? course.title[locale] || course.title.en
    : course.title
  const courseDescription = typeof course.description === 'object'
    ? course.description[locale] || course.description.en
    : course.description

  // Normalize sections: ensure videos, quizzes, articles, pdfs are arrays (API may use different shapes)
  const rawSections = Array.isArray(course.sections) ? course.sections : []
  const sections = rawSections.map((section) => ({
    ...section,
    videos: Array.isArray(section.videos) ? section.videos : [],
    quizzes: Array.isArray(section.quizzes) ? section.quizzes : (Array.isArray(section.contents) ? section.contents.filter((c) => c.type === 'quiz') : []),
    articles: Array.isArray(section.articles) ? section.articles : (Array.isArray(section.contents) ? section.contents.filter((c) => c.type === 'article') : []),
    pdfs: Array.isArray(section.pdfs) ? section.pdfs : (Array.isArray(section.contents) ? section.contents.filter((c) => c.type === 'pdf') : []),
  }))
  const totalVideos = sections.reduce((sum, section) => sum + section.videos.length, 0)
  const totalQuizzes = sections.reduce((sum, section) => sum + section.quizzes.length, 0)
  const totalArticles = sections.reduce((sum, section) => sum + section.articles.length, 0)
  const totalPdfs = sections.reduce((sum, section) => sum + section.pdfs.length, 0)
  const freeVideos = sections.reduce(
    (sum, section) => sum + section.videos.filter((v) => v.isFree).length,
    0
  )

  // Merge section contents in order (same as student course page)
  const getSectionContents = (section) => {
    let orderIndex = 0
    const videos = (section.videos || []).map((v) => ({ ...v, type: 'video', order: v.order !== undefined ? v.order : orderIndex++ }))
    const quizzes = (section.quizzes || []).map((q) => ({ ...q, type: 'quiz', order: q.order !== undefined ? q.order : orderIndex++ }))
    const articles = (section.articles || []).map((a) => ({ ...a, type: 'article', order: a.order !== undefined ? a.order : orderIndex++ }))
    const pdfs = (section.pdfs || []).map((p) => ({ ...p, type: 'pdf', order: p.order !== undefined ? p.order : orderIndex++ }))
    return [...videos, ...quizzes, ...articles, ...pdfs].sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const getContentTitle = (content) => {
    if (!content) return ''
    const title = content.title
    return typeof title === 'object' ? (title[locale] || title.en || '') : (title || '')
  }

  const getSectionTitle = (section) => {
    const title = section.title
    return typeof title === 'object' ? (title[locale] || title.en || '') : (title || '')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Preview as student banner */}
      <div className="bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow">
        <Star className="h-4 w-4" />
        {locale === 'ar' ? 'عرض الدورة كما يراها الطالب' : 'Preview as student — this is how students see the course'}
        <Link href={user?.role === 'admin' ? `/admin/courses/${courseId}/review` : `/instructor/courses/${courseId}`}>
          <Button variant="outline" size="sm" className="ml-4 border-amber-700 text-amber-900 hover:bg-amber-600 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {user?.role === 'admin' ? (locale === 'ar' ? 'العودة للمراجعة' : 'Back to Review') : (locale === 'ar' ? 'العودة للتحرير' : 'Back to Edit')}
          </Button>
        </Link>
      </div>

      <div className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content — matches student course page */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="h-24 w-24 text-primary/50" />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-3xl">{courseTitle}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {courseDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    {course.instructor && (
                      <div>
                        <span>{locale === 'ar' ? 'المدرب: ' : 'Instructor: '}</span>
                        <span className="font-medium">{course.instructor}</span>
                      </div>
                    )}
                    <div>
                      <span>{totalVideos} {t('videos')}</span>
                    </div>
                    {course.level && (
                      <div>
                        <span>{locale === 'ar' ? 'المستوى: ' : 'Level: '}</span>
                        <span>{course.level}</span>
                      </div>
                    )}
                    {course.category && (
                      <div>
                        <span>{locale === 'ar' ? 'الفئة: ' : 'Category: '}</span>
                        <span>{course.category}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course content — videos, quizzes, articles, PDFs */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ar' ? 'محتوى الدورة' : 'Course Content'}</CardTitle>
                  <CardDescription>
                    {locale === 'ar' ? 'المحتوى كما يظهر للطالب' : 'Content as students see it'}
                  </CardDescription>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      <strong>{totalVideos}</strong> {locale === 'ar' ? 'فيديو' : 'videos'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileQuestion className="h-4 w-4 text-purple-600" />
                      <strong>{totalQuizzes}</strong> {locale === 'ar' ? 'اختبارات' : 'quizzes'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <strong>{totalArticles}</strong> {locale === 'ar' ? 'مقالات' : 'articles'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <File className="h-4 w-4 text-red-600" />
                      <strong>{totalPdfs}</strong> {locale === 'ar' ? 'ملفات' : 'files'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sections.map((section, sIdx) => (
                      <div key={section.id || sIdx} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">
                          {getSectionTitle(section)}
                          {section.isFreePreview && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}
                            </span>
                          )}
                        </h3>
                        <div className="space-y-2">
                          {getSectionContents(section).map((content, cIdx) => {
                            const contentKey = content.id ?? `${section.id ?? sIdx}-${content.type}-${cIdx}`
                            if (content.type === 'video') {
                              const video = content
                              const canWatch = video.isFree
                              const videoHref = `/courses/${courseId}/${video.id}`
                              return (
                                <Link
                                  key={contentKey}
                                  href={videoHref}
                                  className="flex items-center justify-between p-3 rounded border-l-4 border-l-blue-500 border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-primary/30 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {canWatch ? (
                                      <PlayCircle className="h-5 w-5 text-primary" />
                                    ) : (
                                      <Lock className="h-5 w-5 text-gray-400" />
                                    )}
                                    <div>
                                      <p className="font-medium">{getContentTitle(video)}</p>
                                      <p className="text-sm text-gray-500">{formatVideoDuration(video.duration)} · {locale === 'ar' ? 'فيديو' : 'Video'}</p>
                                    </div>
                                    {video.isFree && (
                                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        {t('free')}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-primary ml-2">
                                    {locale === 'ar' ? 'معاينة' : 'Preview'} →
                                  </span>
                                </Link>
                              )
                            }
                            if (content.type === 'quiz') {
                              return (
                                <div key={contentKey} className="flex items-center gap-3 p-3 rounded border-l-4 border-l-purple-500 border border-gray-200 bg-gray-50">
                                  <FileQuestion className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                  <p className="font-medium flex-1">{getContentTitle(content)}</p>
                                  {content.isFreePreview && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}</span>
                                  )}
                                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">{locale === 'ar' ? 'اختبار' : 'Quiz'}</span>
                                </div>
                              )
                            }
                            if (content.type === 'article') {
                              const isExpanded = expandedArticleId === content.id
                              return (
                                <div key={content.id} className="rounded border-l-4 border-l-green-500 border border-gray-200 bg-gray-50 overflow-hidden">
                                  <div className="flex items-start gap-3 p-3">
                                    <BookOpen className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium">{getContentTitle(content)}</p>
                                      {content.content && (
                                        <>
                                          <div
                                            className={`text-sm text-gray-600 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}
                                            dangerouslySetInnerHTML={{ __html: content.content }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setExpandedArticleId(isExpanded ? null : content.id)}
                                            className="text-xs text-primary hover:underline mt-1"
                                          >
                                            {isExpanded ? (locale === 'ar' ? 'إخفاء' : 'Show less') : (locale === 'ar' ? 'قراءة المزيد' : 'Read full article')}
                                          </button>
                                        </>
                                      )}
                                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded inline-block mt-1">{locale === 'ar' ? 'مقال' : 'Article'}</span>
                                    </div>
                                    {content.isFreePreview && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">{locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}</span>
                                    )}
                                  </div>
                                </div>
                              )
                            }
                            if (content.type === 'pdf') {
                              const pdfUrl = content.url ?? content.file
                              return (
                                <div key={contentKey} className="flex items-center gap-3 p-3 rounded border-l-4 border-l-red-500 border border-gray-200 bg-gray-50">
                                  <File className="h-5 w-5 text-red-600 flex-shrink-0" />
                                  {pdfUrl ? (
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary hover:underline flex-1"
                                    >
                                      {getContentTitle(content)}
                                    </a>
                                  ) : (
                                    <p className="font-medium flex-1">{getContentTitle(content)}</p>
                                  )}
                                  {content.isFreePreview && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}</span>
                                  )}
                                  <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">{locale === 'ar' ? 'ملف PDF' : 'PDF'}</span>
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
            </div>

            {/* Sidebar — matches student page layout */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {locale === 'ar' ? 'معاينة الدورة' : 'Course Preview'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ar' ? 'هذا ما يراه الطالب قبل التسجيل' : 'This is what students see before enrolling'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{locale === 'ar' ? 'السعر' : 'Price'}</span>
                      <span className="font-medium">{course.price != null ? `${course.price} ر.س` : '0 ر.س'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <PlayCircle className="h-4 w-4 text-blue-600" />
                        {t('videos')}
                      </span>
                      <span className="font-medium">{totalVideos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <FileQuestion className="h-4 w-4 text-purple-600" />
                        {locale === 'ar' ? 'اختبارات' : 'Quizzes'}
                      </span>
                      <span className="font-medium">{totalQuizzes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        {locale === 'ar' ? 'مقالات' : 'Articles'}
                      </span>
                      <span className="font-medium">{totalArticles}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <File className="h-4 w-4 text-red-600" />
                        {locale === 'ar' ? 'ملفات' : 'Files'}
                      </span>
                      <span className="font-medium">{totalPdfs}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span className="text-gray-600">{locale === 'ar' ? 'فيديوهات مجانية' : 'Free Videos'}</span>
                      <span className="font-medium">{freeVideos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{locale === 'ar' ? 'المدة' : 'Duration'}</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Link href={user?.role === 'admin' ? `/admin/courses/${courseId}/review` : `/instructor/courses/${courseId}`}>
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {user?.role === 'admin' ? (locale === 'ar' ? 'العودة للمراجعة' : 'Back to Review') : (locale === 'ar' ? 'العودة للتحرير' : 'Back to Edit')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
