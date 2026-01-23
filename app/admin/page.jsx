'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { BookOpen, Plus, Trash2, Edit, Users, Award, TrendingUp, MessageSquare, Star } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('courses')
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    instructor: '',
    duration: '',
    price: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [user, router, locale])

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes, reviewsRes] = await Promise.all([
        fetch(`/api/courses?locale=${locale}`, { credentials: 'include' }),
        fetch('/api/enrollments', { credentials: 'include' }),
        fetch('/api/reviews?courseId=all', { credentials: 'include' }).catch(() => ({ ok: false })),
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
      }

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json()
        setEnrollments(data.enrollments || [])
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          students: 0,
          sections: [],
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          title: { en: '', ar: '' },
          description: { en: '', ar: '' },
          instructor: '',
          duration: '',
          price: '',
        })
        fetchData()
      } else {
        alert('Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Error creating course')
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الدورة؟' : 'Are you sure you want to delete this course?')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchData()
        alert(locale === 'ar' ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Error deleting course')
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const totalCourses = courses.length
  const totalEnrollments = enrollments.length
  const totalRevenue = courses.reduce((sum, course) => {
    const enrollmentsForCourse = enrollments.filter(e => e.courseId === course.id.toString())
    return sum + (course.price * enrollmentsForCourse.length)
  }, 0)
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {locale === 'ar' ? 'لوحة التحكم - المدير' : 'Admin Panel'}
              </h1>
              <p className="text-gray-600">
                {locale === 'ar'
                  ? 'إدارة الدورات والمستخدمين والمحتوى'
                  : 'Manage courses, users, and content'}
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'إضافة دورة' : 'Add Course'}
            </Button>
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
                  {locale === 'ar' ? 'إجمالي التسجيلات' : 'Total Enrollments'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEnrollments}</div>
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
                  {locale === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageRating} ⭐</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('courses')}
                className={`pb-4 px-4 font-medium transition-colors ${
                  activeTab === 'courses'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {locale === 'ar' ? 'الدورات' : 'Courses'}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-4 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {locale === 'ar' ? 'التقييمات' : 'Reviews'}
              </button>
            </div>
          </div>

          {/* Course Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'إضافة دورة جديدة' : 'Add New Course'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (English)</Label>
                      <Input
                        value={formData.title.en}
                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (Arabic)</Label>
                      <Input
                        value={formData.title.ar}
                        onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ar: e.target.value } })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (English)</Label>
                      <Input
                        value={formData.description.en}
                        onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Arabic)</Label>
                      <Input
                        value={formData.description.ar}
                        onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ar: e.target.value } })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{locale === 'ar' ? 'المدرب' : 'Instructor'}</Label>
                      <Input
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{locale === 'ar' ? 'المدة' : 'Duration'}</Label>
                      <Input
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="10 hours"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{locale === 'ar' ? 'السعر' : 'Price'}</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{locale === 'ar' ? 'إنشاء' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const courseTitle = typeof course.title === 'object' 
                  ? course.title[locale] || course.title.en 
                  : course.title
                const enrollmentsForCourse = enrollments.filter(e => e.courseId === course.id.toString())
                const courseReviews = reviews.filter(r => r.courseId === course.id.toString())
                const avgRating = courseReviews.length > 0
                  ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1)
                  : 0

                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <CardTitle className="text-xl line-clamp-2">{courseTitle}</CardTitle>
                      <CardDescription>{course.instructor}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {locale === 'ar' ? 'السعر:' : 'Price:'} ${course.price}
                        </p>
                        <p className="text-sm text-gray-600">
                          {locale === 'ar' ? 'الطلاب:' : 'Students:'} {enrollmentsForCourse.length}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {avgRating} ({courseReviews.length} {locale === 'ar' ? 'تقييم' : 'reviews'})
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => {
                  const course = courses.find(c => c.id.toString() === review.courseId)
                  const courseTitle = course ? (typeof course.title === 'object' 
                    ? course.title[locale] || course.title.en 
                    : course.title) : 'Unknown Course'

                  return (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{courseTitle}</h3>
                            <p className="text-sm text-gray-600">
                              {review.user?.name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
