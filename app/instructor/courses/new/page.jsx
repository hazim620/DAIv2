'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewCoursePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'general',
    level: 'beginner',
    language: 'en',
    price: 0,
    thumbnail: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/instructor/courses/${data.course.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/instructor">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'العودة' : 'Back'}
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course'}</CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'ابدأ بإنشاء دورة جديدة. يمكنك إضافة المحتوى لاحقاً.'
                  : 'Start by creating a new course. You can add content later.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">
                    {locale === 'ar' ? 'عنوان الدورة' : 'Course Title'} *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder={locale === 'ar' ? 'أدخل عنوان الدورة' : 'Enter course title'}
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription">
                    {locale === 'ar' ? 'وصف مختصر' : 'Short Description'}
                  </Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder={locale === 'ar' ? 'وصف مختصر للدورة' : 'Brief course description'}
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    {locale === 'ar' ? 'الوصف الكامل' : 'Full Description'} *
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={locale === 'ar' ? 'وصف مفصل للدورة' : 'Detailed course description'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">
                      {locale === 'ar' ? 'الفئة' : 'Category'}
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="general">General</option>
                      <option value="programming">Programming</option>
                      <option value="data-science">Data Science</option>
                      <option value="business">Business</option>
                      <option value="design">Design</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="level">
                      {locale === 'ar' ? 'المستوى' : 'Level'}
                    </Label>
                    <select
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">
                      {locale === 'ar' ? 'السعر' : 'Price'} ($)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="language">
                      {locale === 'ar' ? 'اللغة' : 'Language'}
                    </Label>
                    <select
                      id="language"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="thumbnail">
                    {locale === 'ar' ? 'رابط الصورة المصغرة' : 'Thumbnail URL'}
                  </Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="/api/placeholder/400/250"
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading
                      ? locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                      : locale === 'ar' ? 'إنشاء الدورة' : 'Create Course'}
                  </Button>
                  <Link href="/instructor">
                    <Button type="button" variant="outline">
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
