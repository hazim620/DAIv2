'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { getTranslation } from '@/lib/i18n'
import { PlayCircle, Clock, Users } from 'lucide-react'

export default function CoursesPage() {
  const [locale, setLocale] = useState('en')
  const t = (key) => getTranslation(locale, key)

  useEffect(() => {
    setLocale(localStorage.getItem('locale') || 'en')
  }, [])

  // Mock courses data - replace with actual API call
  const courses = [
    {
      id: 1,
      title: locale === 'ar' ? 'مقدمة في علوم البيانات' : 'Introduction to Data Science',
      description: locale === 'ar'
        ? 'تعلم أساسيات علوم البيانات من الصفر'
        : 'Learn the fundamentals of data science from scratch',
      instructor: 'Dr. Ahmed Ali',
      duration: '10 hours',
      students: 1250,
      price: 99,
      thumbnail: '/api/placeholder/400/250',
    },
    {
      id: 2,
      title: locale === 'ar' ? 'تعلم الآلة والذكاء الاصطناعي' : 'Machine Learning & AI',
      description: locale === 'ar'
        ? 'دورة شاملة في تعلم الآلة والذكاء الاصطناعي'
        : 'Comprehensive course on machine learning and AI',
      instructor: 'Prof. Sarah Johnson',
      duration: '15 hours',
      students: 2100,
      price: 149,
      thumbnail: '/api/placeholder/400/250',
    },
    {
      id: 3,
      title: locale === 'ar' ? 'تحليل البيانات باستخدام Python' : 'Data Analysis with Python',
      description: locale === 'ar'
        ? 'استخدم Python لتحليل البيانات وإنشاء التقارير'
        : 'Use Python to analyze data and create reports',
      instructor: 'Eng. Mohammed Hassan',
      duration: '12 hours',
      students: 980,
      price: 79,
      thumbnail: '/api/placeholder/400/250',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('allCourses')}</h1>
            <p className="text-gray-600">
              {locale === 'ar'
                ? 'استكشف مجموعة واسعة من الدورات التعليمية'
                : 'Explore a wide range of educational courses'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-primary/50" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.students.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-600">{locale === 'ar' ? 'المدرب:' : 'Instructor:'}</p>
                        <p className="font-medium">{course.instructor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${course.price}</p>
                      </div>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full">
                        {t('courseDetails')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
