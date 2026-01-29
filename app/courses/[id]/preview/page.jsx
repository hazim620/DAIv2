'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Play, FileText, FileQuestion, BookOpen, File } from 'lucide-react'
import Link from 'next/link'

export default function CoursePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      router.push('/login')
      return
    }
    fetchCourse()
  }, [user, router, courseId])

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
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const courseTitle = typeof course.title === 'object' 
    ? course.title[locale] || course.title.en 
    : course.title
  const courseDescription = typeof course.description === 'object'
    ? course.description[locale] || course.description.en
    : course.description

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Link href={`/instructor/courses/${courseId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'العودة للتحرير' : 'Back to Edit'}
            </Button>
          </Link>

          <Card className="mb-6">
            <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {course.thumbnail && (
                <img 
                  src={course.thumbnail} 
                  alt={courseTitle}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-3xl">{courseTitle}</CardTitle>
              <CardDescription className="text-base">{courseDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{locale === 'ar' ? 'المستوى: ' : 'Level: '}{course.level}</span>
                <span>{locale === 'ar' ? 'الفئة: ' : 'Category: '}{course.category}</span>
                <span>{locale === 'ar' ? 'السعر: ' : 'Price: '}${course.price || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Course Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'محتوى الدورة' : 'Course Content'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.sections?.map((section, sIdx) => {
                  const sectionTitle = typeof section.title === 'object'
                    ? section.title[locale] || section.title.en
                    : section.title

                  return (
                    <div key={section.id || sIdx} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">
                        {sIdx + 1}. {sectionTitle}
                        {section.isFreePreview && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}
                          </span>
                        )}
                      </h3>
                      
                      <div className="space-y-2">
                        {section.videos?.map((video, vIdx) => {
                          const videoTitle = typeof video.title === 'object'
                            ? video.title[locale] || video.title.en
                            : video.title
                          return (
                            <div key={video.id || vIdx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <Play className="h-5 w-5 text-blue-600" />
                              <span>{videoTitle}</span>
                              {video.duration && (
                                <span className="text-sm text-gray-500 ml-auto">
                                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          )
                        })}

                        {section.quizzes?.map((quiz, qIdx) => {
                          const quizTitle = typeof quiz.title === 'object'
                            ? quiz.title[locale] || quiz.title.en
                            : quiz.title
                          return (
                            <div key={quiz.id || qIdx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <FileQuestion className="h-5 w-5 text-purple-600" />
                              <span>{quizTitle}</span>
                            </div>
                          )
                        })}

                        {section.articles?.map((article, aIdx) => {
                          const articleTitle = typeof article.title === 'object'
                            ? article.title[locale] || article.title.en
                            : article.title
                          return (
                            <div key={article.id || aIdx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <BookOpen className="h-5 w-5 text-green-600" />
                              <span>{articleTitle}</span>
                            </div>
                          )
                        })}

                        {section.pdfs?.map((pdf, pIdx) => {
                          const pdfTitle = typeof pdf.title === 'object'
                            ? pdf.title[locale] || pdf.title.en
                            : pdf.title
                          const pdfUrl = pdf.url ?? pdf.file
                          return (
                            <div key={pdf.id || pIdx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <File className="h-5 w-5 text-red-600 flex-shrink-0" />
                              {pdfUrl ? (
                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {pdfTitle}
                                </a>
                              ) : (
                                <span>{pdfTitle}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
