'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { getTranslation } from '@/lib/i18n'
import { PlayCircle, Lock, CheckCircle, Clock } from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id
  const [locale, setLocale] = useState('en')
  const [enrolled, setEnrolled] = useState(false)
  const t = (key) => getTranslation(locale, key)

  useEffect(() => {
    setLocale(localStorage.getItem('locale') || 'en')
    // TODO: Fetch course data based on courseId
  }, [courseId])

  // Mock course data - replace with actual API call
  const course = {
    id: courseId,
    title: locale === 'ar' ? 'مقدمة في علوم البيانات' : 'Introduction to Data Science',
    description: locale === 'ar'
      ? 'دورة شاملة تغطي جميع أساسيات علوم البيانات من الصفر إلى المستوى المتقدم. ستتعلم كيفية جمع البيانات، تنظيفها، تحليلها، وعرضها باستخدام أحدث الأدوات والتقنيات.'
      : 'A comprehensive course covering all fundamentals of data science from scratch to advanced level. You will learn how to collect, clean, analyze, and visualize data using the latest tools and techniques.',
    instructor: 'Dr. Ahmed Ali',
    duration: '10 hours',
    students: 1250,
    price: 99,
    sections: [
      {
        id: 1,
        title: locale === 'ar' ? 'القسم الأول: المقدمة' : 'Section 1: Introduction',
        videos: [
          {
            id: 1,
            title: locale === 'ar' ? 'ما هي علوم البيانات؟' : 'What is Data Science?',
            duration: '15:30',
            isFree: true,
            isWatched: false,
          },
          {
            id: 2,
            title: locale === 'ar' ? 'أدوات علوم البيانات' : 'Data Science Tools',
            duration: '20:45',
            isFree: false,
            isWatched: false,
          },
          {
            id: 3,
            title: locale === 'ar' ? 'إعداد البيئة' : 'Setting Up Environment',
            duration: '12:20',
            isFree: false,
            isWatched: false,
          },
        ],
      },
      {
        id: 2,
        title: locale === 'ar' ? 'القسم الثاني: أساسيات Python' : 'Section 2: Python Basics',
        videos: [
          {
            id: 4,
            title: locale === 'ar' ? 'مقدمة إلى Python' : 'Introduction to Python',
            duration: '18:15',
            isFree: false,
            isWatched: false,
          },
          {
            id: 5,
            title: locale === 'ar' ? 'البيانات والهياكل' : 'Data Structures',
            duration: '25:30',
            isFree: false,
            isWatched: false,
          },
        ],
      },
    ],
  }

  const handleVideoClick = (video) => {
    if (video.isFree || enrolled) {
      // TODO: Navigate to video player
      console.log('Playing video:', video)
    } else {
      // TODO: Show payment modal or redirect to payment
      alert(locale === 'ar' 
        ? 'يرجى التسجيل في الدورة لمشاهدة هذا الفيديو'
        : 'Please enroll in the course to watch this video')
    }
  }

  const handleEnroll = () => {
    // TODO: Implement enrollment/payment logic
    setEnrolled(true)
    console.log('Enrolling in course:', courseId)
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
                          {section.videos.map((video) => (
                            <div
                              key={video.id}
                              className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                                video.isFree || enrolled
                                  ? 'hover:bg-gray-50 border-gray-200'
                                  : 'opacity-60 border-gray-300'
                              }`}
                              onClick={() => handleVideoClick(video)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {video.isFree || enrolled ? (
                                  <PlayCircle className="h-5 w-5 text-primary" />
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
                          ))}
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
                    {locale === 'ar'
                      ? 'سعر الدورة'
                      : 'Course Price'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('videos')}</span>
                      <span className="font-medium">{totalVideos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{locale === 'ar' ? 'فيديوهات مجانية' : 'Free Videos'}</span>
                      <span className="font-medium">{freeVideos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{locale === 'ar' ? 'المدة' : 'Duration'}</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    {enrolled ? (
                      <Button className="w-full" variant="outline" disabled>
                        {locale === 'ar' ? 'مسجل بالفعل' : 'Already Enrolled'}
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={handleEnroll}>
                        {t('enrollNow')}
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
