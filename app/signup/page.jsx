'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const { locale, t } = useLanguage()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = locale === 'ar' 
        ? 'كلمات المرور غير متطابقة'
        : 'Passwords do not match'
    }

    if (formData.password.length < 6) {
      newErrors.password = locale === 'ar'
        ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        : 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)

    const result = await signup(formData.email, formData.password, formData.fullName)
    
    if (result.success) {
      router.push('/dashboard')
    } else {
      setErrors({ general: result.error || 'Signup failed' })
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">{t('createAccount')}</CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'أنشئ حسابك للبدء في التعلم'
                : 'Create your account to start learning'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {errors.general}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder={locale === 'ar' ? 'الاسم الكامل' : 'John Doe'}
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={locale === 'ar' ? 'example@email.com' : 'example@email.com'}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading') : t('createAccount')}
              </Button>
              <div className="text-center text-sm">
                <span className="text-gray-600">
                  {t('alreadyHaveAccount')}{' '}
                </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t('login')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
