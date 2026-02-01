'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { CheckCircle, XCircle, ArrowLeft, User, Mail, Calendar, GraduationCap } from 'lucide-react'

export default function AdminInstructorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const instructorId = params.id
  const { user } = useAuth()
  const { locale } = useLanguage()
  const [instructor, setInstructor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const fetchInstructor = async () => {
      try {
        const res = await fetch(`/api/admin/instructors/${instructorId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setInstructor(data.instructor || null)
        } else {
          setInstructor(null)
        }
      } catch (e) {
        console.error('Fetch instructor error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchInstructor()
  }, [user, instructorId])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/instructors/${instructorId}/approve`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        alert(locale === 'ar' ? 'تم الموافقة على الحساب' : 'Instructor approved')
        router.push('/admin/instructors')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert(locale === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please provide rejection reason')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/instructors/${instructorId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason }),
      })
      if (res.ok) {
        alert(locale === 'ar' ? 'تم رفض الحساب' : 'Instructor rejected')
        router.push('/admin/instructors')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !instructor) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  const name = [instructor.firstName, instructor.lastName].filter(Boolean).join(' ') || instructor.name || '-'
  const statusLabels = {
    email_not_verified: locale === 'ar' ? 'غير محقق البريد' : 'Email not verified',
    pending_admin_approval: locale === 'ar' ? 'قيد المراجعة' : 'Pending',
    approved: locale === 'ar' ? 'موافق عليه' : 'Approved',
    rejected: locale === 'ar' ? 'مرفوض' : 'Rejected',
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/instructors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {locale === 'ar' ? 'رجوع' : 'Back'}
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6" />
              {name}
            </CardTitle>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {instructor.email}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {locale === 'ar' ? 'الحالة:' : 'Status:'} {statusLabels[instructor.accountStatus] || instructor.accountStatus}
            </p>
          </div>
          {instructor.accountStatus === 'pending_admin_approval' && (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'موافقة' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReject(!showReject)}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'رفض' : 'Reject'}
              </Button>
            </div>
          )}
        </CardHeader>
        {showReject && (
          <CardContent className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              {locale === 'ar' ? 'سبب الرفض (إلزامي)' : 'Rejection reason (required)'}
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full max-w-md border rounded px-3 py-2"
              rows={3}
              placeholder={locale === 'ar' ? 'أدخل سبب الرفض' : 'Enter rejection reason'}
            />
            <Button className="mt-2" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
              {locale === 'ar' ? 'إرسال الرفض' : 'Submit Rejection'}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{locale === 'ar' ? 'بيانات التسجيل' : 'Registration Data'}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'الاسم الأول' : 'First name'}</dt>
              <dd className="font-medium">{instructor.firstName || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'الاسم الأخير' : 'Last name'}</dt>
              <dd className="font-medium">{instructor.lastName || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</dt>
              <dd className="font-medium">{instructor.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'رقم الجوال' : 'Mobile'}</dt>
              <dd className="font-medium">{instructor.mobileNumber || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'الجنسية' : 'Nationality'}</dt>
              <dd className="font-medium">{instructor.nationality || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'دولة الإقامة' : 'Country of residence'}</dt>
              <dd className="font-medium">{instructor.countryOfResidence || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of birth'}</dt>
              <dd className="font-medium">
                {instructor.dateOfBirth ? new Date(instructor.dateOfBirth).toLocaleDateString() : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'الجنس' : 'Gender'}</dt>
              <dd className="font-medium">{instructor.gender || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'المستوى التعليمي' : 'Education level'}</dt>
              <dd className="font-medium">{instructor.educationLevel || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'الجامعة' : 'University'}</dt>
              <dd className="font-medium">{instructor.universityName || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'التخصص' : 'Major'}</dt>
              <dd className="font-medium">{instructor.major || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{locale === 'ar' ? 'مستوى الجاهزية' : 'Readiness level'}</dt>
              <dd className="font-medium">{instructor.readinessLevel || '-'}</dd>
            </div>
            {instructor.adminRejectionReason && (
              <div className="md:col-span-2">
                <dt className="text-gray-500">{locale === 'ar' ? 'سبب الرفض السابق' : 'Previous rejection reason'}</dt>
                <dd className="font-medium text-red-600">{instructor.adminRejectionReason}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
