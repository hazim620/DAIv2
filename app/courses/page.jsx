'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { useLanguage } from '@/contexts/language-context'
import { PlayCircle, Clock, Users, Search } from 'lucide-react'

export default function CoursesPage() {
  const { locale, t } = useLanguage()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [locale])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses)
    } else {
      const filtered = courses.filter(course => {
        const title = typeof course.title === 'object' ? course.title[locale] || course.title.en : course.title
        const description = typeof course.description === 'object' ? course.description[locale] || course.description.en : course.description
        const query = searchQuery.toLowerCase()
        return title.toLowerCase().includes(query) || 
               description.toLowerCase().includes(query) ||
               course.instructor.toLowerCase().includes(query)
      })
      setFilteredCourses(filtered)
    }
  }, [searchQuery, courses, locale])

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/courses?locale=${locale}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        setFilteredCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
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

  // Fallback courses if API fails
  const fallbackCourses = [
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
            <p className="text-gray-600 mb-4">
              {locale === 'ar'
                ? 'استكشف مجموعة واسعة من الدورات التعليمية'
                : 'Explore a wide range of educational courses'}
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={locale === 'ar' ? 'ابحث عن دورة...' : 'Search for a course...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">
                  {searchQuery
                    ? (locale === 'ar' ? 'لم يتم العثور على دورات' : 'No courses found')
                    : (locale === 'ar' ? 'لا توجد دورات متاحة حالياً' : 'No courses available at the moment')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
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
          )}
        </div>
      </div>
    </div>
  )
}
