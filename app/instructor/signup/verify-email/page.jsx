'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { useLanguage } from '@/contexts/language-context'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale, t } = useLanguage()
  const email = searchParams.get('email')
  const token = searchParams.get('token')
  const [status, setStatus] = useState('pending') // pending, verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken) => {
    setStatus('verifying')
    try {
      const response = await fetch('/api/instructor/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(
          locale === 'ar'
            ? 'تم التحقق من بريدك الإلكتروني بنجاح! حسابك قيد المراجعة من قبل الأدمن.'
            : 'Email verified successfully! Your account is under admin review.'
        )
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  const resendVerification = async () => {
    if (!email) return

    try {
      const response = await fetch('/api/instructor/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(
          locale === 'ar'
            ? 'تم إرسال رابط التحقق مرة أخرى إلى بريدك الإلكتروني'
            : 'Verification link has been resent to your email'
        )
      } else {
        setMessage(data.error || 'Failed to resend verification')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">
              {locale === 'ar' ? 'التحقق من البريد الإلكتروني' : 'Verify Email'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'يرجى التحقق من بريدك الإلكتروني'
                : 'Please verify your email address'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'pending' && (
              <>
                <p className="text-center text-gray-600">
                  {locale === 'ar' ? (
                    <>
                      تم إرسال رابط التحقق إلى <strong>{email}</strong>
                      <br />
                      يرجى التحقق من بريدك الإلكتروني والنقر على الرابط
                    </>
                  ) : (
                    <>
                      A verification link has been sent to <strong>{email}</strong>
                      <br />
                      Please check your email and click the link
                    </>
                  )}
                </p>
                {email && (
                  <Button onClick={resendVerification} variant="outline" className="w-full">
                    {locale === 'ar' ? 'إعادة إرسال رابط التحقق' : 'Resend Verification Link'}
                  </Button>
                )}
              </>
            )}

            {status === 'verifying' && (
              <div className="text-center">
                <p className="text-gray-600">
                  {locale === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-4xl">✓</div>
                <p className="text-green-600">{message}</p>
                <p className="text-sm text-gray-500">
                  {locale === 'ar'
                    ? 'سيتم توجيهك إلى صفحة تسجيل الدخول...'
                    : 'Redirecting to login page...'}
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="text-red-600 text-4xl">✗</div>
                <p className="text-red-600">{message}</p>
                {email && (
                  <Button onClick={resendVerification} variant="outline" className="w-full">
                    {locale === 'ar' ? 'إعادة إرسال رابط التحقق' : 'Resend Verification Link'}
                  </Button>
                )}
              </div>
            )}

            <div className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                {locale === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
