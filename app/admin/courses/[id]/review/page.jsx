'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { CheckCircle, XCircle, MessageSquare, ArrowLeft, Play, FileText, BookOpen } from 'lucide-react'

export default function AdminCourseReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id
  const { user } = useAuth()
  const { locale } = useLanguage()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [modComment, setModComment] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showMod, setShowMod] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setCourse(data.course || data)
        }
      } catch (e) {
        console.error('Fetch course error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [user, courseId])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/approve`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        alert(locale === 'ar' ? 'تم نشر الدورة' : 'Course approved and published')
        router.push('/admin/courses/review')
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
    if (!rejectReason.trim()) {
      alert(locale === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please enter rejection reason')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        alert(locale === 'ar' ? 'تم رفض الدورة' : 'Course rejected')
        router.push('/admin/courses/review')
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

  const handleRequestModifications = async () => {
    if (!modComment.trim()) {
      alert(locale === 'ar' ? 'يرجى إدخال تعليق التعديلات' : 'Please enter modification comment')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/request-modifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment: modComment }),
      })
      if (res.ok) {
        alert(locale === 'ar' ? 'تم إرسال طلب التعديلات للمدرب' : 'Modifications requested')
        router.push('/admin/courses/review')
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

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  const title = typeof course.title === 'object' ? (course.title[locale] || course.title.en || course.title.ar) : course.title
  const description = typeof course.description === 'object' ? (course.description?.[locale] || course.description?.en) : course.description
  const sections = Array.isArray(course.sections) ? course.sections : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/courses/review">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {locale === 'ar' ? 'رجوع' : 'Back'}
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-gray-600 mt-1">{course.instructor}</p>
            <p className="text-sm text-gray-500 mt-1">
              {locale === 'ar' ? 'الحالة:' : 'Status:'} {course.status}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'موافقة ونشر' : 'Approve & Publish'}
            </Button>
            <Button variant="outline" onClick={() => { setShowReject(!showReject); setShowMod(false) }} disabled={actionLoading}>
              <XCircle className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'رفض' : 'Reject'}
            </Button>
            <Button variant="outline" onClick={() => { setShowMod(!showMod); setShowReject(false) }} disabled={actionLoading}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'طلب تعديلات' : 'Request Modifications'}
            </Button>
          </div>
        </CardHeader>
        {showReject && (
          <CardContent className="border-t pt-4">
            <Label>{locale === 'ar' ? 'سبب الرفض (إلزامي)' : 'Rejection reason (required)'}</Label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={locale === 'ar' ? 'أدخل سبب الرفض' : 'Enter rejection reason'}
              className="mt-2 w-full min-h-[120px] max-w-2xl p-3 border rounded-md text-sm"
              rows={5}
            />
            <Button className="mt-2" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
              {locale === 'ar' ? 'إرسال الرفض' : 'Submit Rejection'}
            </Button>
          </CardContent>
        )}
        {showMod && (
          <CardContent className="border-t pt-4">
            <Label>{locale === 'ar' ? 'تعليق التعديلات (إلزامي)' : 'Modification comment (required)'}</Label>
            <textarea
              value={modComment}
              onChange={(e) => setModComment(e.target.value)}
              placeholder={locale === 'ar' ? 'ما التعديلات المطلوبة؟' : 'What modifications are needed?'}
              className="mt-2 w-full min-h-[120px] max-w-2xl p-3 border rounded-md text-sm"
              rows={5}
            />
            <Button className="mt-2" onClick={handleRequestModifications} disabled={actionLoading || !modComment.trim()}>
              {locale === 'ar' ? 'إرسال طلب التعديلات' : 'Request Modifications'}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{locale === 'ar' ? 'الوصف' : 'Description'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{description || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {locale === 'ar' ? 'المحتوى (أقسام ودروس)' : 'Content (sections & lessons)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div key={sec.id || idx} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{sec.title || 'Section ' + (idx + 1)}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {(sec.contents || []).map((item, i) => (
                    <li key={item.id || i} className="flex items-center gap-2">
                      {item.type === 'video' && <Play className="h-4 w-4 text-red-500" />}
                      {item.type === 'article' && <FileText className="h-4 w-4 text-blue-500" />}
                      {item.type === 'quiz' && <BookOpen className="h-4 w-4 text-amber-500" />}
                      {item.type === 'file' && <FileText className="h-4 w-4 text-gray-500" />}
                      {item.title || item.name || (item.type + ' ' + (i + 1))}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {sections.length === 0 && (
            <p className="text-gray-500">{locale === 'ar' ? 'لا يوجد محتوى بعد' : 'No content yet'}</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href={`/courses/${courseId}/preview`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            {locale === 'ar' ? 'معاينة الدورة كطالب' : 'Preview course as student'}
          </Button>
        </Link>
      </div>
    </div>
  )
}
