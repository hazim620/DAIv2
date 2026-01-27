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
import { Lock, User, Mail, Save } from 'lucide-react'

export default function InstructorSettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { locale, t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccess('')

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setErrors({ general: locale === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors({ confirmPassword: locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' })
      return
    }

    // Password requirements
    if (passwordForm.newPassword.length < 8) {
      setErrors({ newPassword: locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters' })
      return
    }
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      setErrors({ newPassword: locale === 'ar' ? 'كلمة المرور يجب أن تحتوي على حرف كبير' : 'Password must contain an uppercase letter' })
      return
    }
    if (!/[a-z]/.test(passwordForm.newPassword)) {
      setErrors({ newPassword: locale === 'ar' ? 'كلمة المرور يجب أن تحتوي على حرف صغير' : 'Password must contain a lowercase letter' })
      return
    }
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      setErrors({ newPassword: locale === 'ar' ? 'كلمة المرور يجب أن تحتوي على رقم' : 'Password must contain a number' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.' : 'Password changed successfully. Please login again.')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => {
          logout()
          router.push('/login')
        }, 2000)
      } else {
        setErrors({ general: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
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
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">
            {locale === 'ar' ? 'الإعدادات' : 'Settings'}
          </h1>

          {/* Change Password */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'قم بتغيير كلمة المرور الخاصة بك. سيتم تسجيل خروجك من جميع الأجهزة.'
                  : 'Change your password. You will be logged out from all devices.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {errors.general}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                    {success}
                  </div>
                )}
                <div>
                  <Label htmlFor="currentPassword">
                    {locale === 'ar' ? 'كلمة المرور الحالية *' : 'Current Password *'}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">
                    {locale === 'ar' ? 'كلمة المرور الجديدة *' : 'New Password *'}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {locale === 'ar'
                      ? '8 أحرف على الأقل، حرف كبير، حرف صغير، رقم'
                      : 'At least 8 characters, uppercase, lowercase, number'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">
                    {locale === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm New Password *'}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading
                    ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {locale === 'ar' ? 'معلومات الملف الشخصي' : 'Profile Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>{locale === 'ar' ? 'الاسم' : 'Name'}</Label>
                  <Input value={user.name || ''} disabled />
                </div>
                <div>
                  <Label>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input value={user.email || ''} disabled />
                </div>
                <div>
                  <Label>{locale === 'ar' ? 'الدور' : 'Role'}</Label>
                  <Input value={user.role || ''} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
