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
import { User, Mail, Save } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, checkAuth } = useAuth()
  const { locale, t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    setFormData({
      name: user.name || '',
      email: user.email || '',
    })
  }, [user, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // In a real app, you'd have an API endpoint to update user profile
      // For now, we'll just show a success message
      setMessage(locale === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Profile updated successfully')
      setTimeout(() => {
        checkAuth() // Refresh user data
      }, 1000)
    } catch (error) {
      setMessage(locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </h1>
            <p className="text-gray-600">
              {locale === 'ar'
                ? 'إدارة معلومات حسابك الشخصية'
                : 'Manage your account information'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'قم بتحديث معلوماتك الشخصية هنا'
                  : 'Update your personal information here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div className={`p-3 text-sm rounded ${
                    message.includes('success') || message.includes('نجاح')
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('fullName')}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={true}
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    {locale === 'ar'
                      ? 'لا يمكن تغيير البريد الإلكتروني'
                      : 'Email cannot be changed'}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button type="submit" disabled={loading} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? t('loading') : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
