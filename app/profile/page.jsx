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
import { User, Mail, Save, Lock, CreditCard } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, checkAuth, logout } = useAuth()
  const { locale, t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bankInfo: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [profileSaveLoading, setProfileSaveLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    setFormData({
      name: user.name || '',
      email: user.email || '',
      bankInfo: user.bankInfo || '',
    })
  }, [user, router])

  const handleSaveProfile = async (e) => {
    e?.preventDefault?.()
    setMessage('')
    setProfileSaveLoading(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bankInfo: formData.bankInfo || '' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(locale === 'ar' ? 'تم حفظ البيانات بنجاح' : 'Data saved successfully')
        await checkAuth()
      } else {
        setMessage(data.error || (locale === 'ar' ? 'فشل الحفظ' : 'Save failed'))
      }
    } catch (err) {
      setMessage(locale === 'ar' ? 'خطأ في الشبكة' : 'Network error')
    } finally {
      setProfileSaveLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordErrors({})
    setPasswordSuccess('')
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordErrors({ general: locale === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordErrors({ newPassword: locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters' })
      return
    }
    setPasswordLoading(true)
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
        setPasswordSuccess(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.' : data.message || 'Password changed successfully.')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => {
          logout()
          router.push('/login')
        }, 2000)
      } else {
        setPasswordErrors({ general: data.error || (locale === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to change password') })
      }
    } catch (err) {
      setPasswordErrors({ general: locale === 'ar' ? 'خطأ في الشبكة' : 'Network error' })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </h1>
            <p className="text-gray-600">
              {locale === 'ar'
                ? 'عرض معلومات حسابك (لا يمكن تعديل البيانات الشخصية)'
                : 'View your account information (personal data cannot be edited)'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'معلومات الحساب للعرض فقط'
                  : 'Account information is read-only'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('fullName')}
                </Label>
                <Input id="name" value={formData.name} disabled className="bg-gray-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('email')}
                </Label>
                <Input id="email" type="email" value={formData.email} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500">
                  {locale === 'ar' ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankInfo" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {locale === 'ar' ? 'المعلومات البنكية' : 'Bank Information'}
                </Label>
                <Input
                  id="bankInfo"
                  placeholder={locale === 'ar' ? 'رقم الحساب البنكي أو IBAN (للتحويلات)' : 'Bank account or IBAN (for transfers)'}
                  value={formData.bankInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankInfo: e.target.value }))}
                  disabled={loading}
                  className="bg-white"
                />
                <p className="text-xs text-gray-500">
                  {locale === 'ar' ? 'يُستخدم للتحويلات عند استحقاق المدفوعات' : 'Used for transfers when payments are due'}
                </p>
              </div>
              {message && !passwordSuccess && (
                <div className={`mt-3 p-3 text-sm rounded ${message.includes('نجاح') || message.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {message}
                </div>
              )}
              <Button type="button" onClick={handleSaveProfile} disabled={profileSaveLoading} className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                {profileSaveLoading ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ البيانات' : 'Save data')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'قم بتغيير كلمة المرور. سيتم تسجيل خروجك بعد التغيير.'
                  : 'Change your password. You will be logged out after the change.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordErrors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {passwordErrors.general}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <Label htmlFor="currentPassword">{locale === 'ar' ? 'كلمة المرور الحالية *' : 'Current Password *'}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">{locale === 'ar' ? 'كلمة المرور الجديدة *' : 'New Password *'}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    disabled={passwordLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {locale === 'ar' ? '8 أحرف على الأقل، حرف كبير، حرف صغير، رقم' : 'At least 8 characters, uppercase, lowercase, number'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{locale === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm New Password *'}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    disabled={passwordLoading}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {passwordLoading ? t('loading') : (locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
