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
import { CheckCircle, XCircle, Eye, Mail, User, Calendar, GraduationCap } from 'lucide-react'

export default function AdminInstructorsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchInstructors()
  }, [user, router])

  const fetchInstructors = async () => {
    try {
      const res = await fetch('/api/admin/instructors', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInstructors(data.instructors || [])
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (instructorId) => {
    try {
      const res = await fetch(`/api/admin/instructors/${instructorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (res.ok) {
        await fetchInstructors()
        alert(locale === 'ar' ? 'تم الموافقة على الحساب' : 'Instructor approved')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to approve')
      }
    } catch (error) {
      console.error('Error approving instructor:', error)
      alert('Network error')
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert(locale === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please provide a rejection reason')
      return
    }

    try {
      const res = await fetch(`/api/admin/instructors/${selectedInstructor.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (res.ok) {
        await fetchInstructors()
        setShowRejectModal(false)
        setSelectedInstructor(null)
        setRejectionReason('')
        alert(locale === 'ar' ? 'تم رفض الحساب' : 'Instructor rejected')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reject')
      }
    } catch (error) {
      console.error('Error rejecting instructor:', error)
      alert('Network error')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      email_not_verified: { color: 'bg-gray-100 text-gray-800', label: locale === 'ar' ? 'غير محقق' : 'Not Verified' },
      pending_admin_approval: { color: 'bg-blue-100 text-blue-800', label: locale === 'ar' ? 'قيد المراجعة' : 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: locale === 'ar' ? 'موافق عليه' : 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: locale === 'ar' ? 'مرفوض' : 'Rejected' },
    }
    const badge = badges[status] || badges.pending_admin_approval
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
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

  const pendingInstructors = instructors.filter(i => i.accountStatus === 'pending_admin_approval')
  const allInstructors = instructors

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {locale === 'ar' ? 'إدارة المعلمين' : 'Instructor Management'}
            </h1>
            <p className="text-gray-600">
              {locale === 'ar' ? 'مراجعة وموافقة على طلبات المعلمين' : 'Review and approve instructor applications'}
            </p>
          </div>

          {/* Pending Approvals */}
          {pendingInstructors.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {locale === 'ar' ? 'طلبات قيد المراجعة' : 'Pending Approvals'} ({pendingInstructors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingInstructors.map((instructor) => (
                    <div key={instructor.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="h-5 w-5 text-gray-500" />
                            <h3 className="text-lg font-semibold">
                              {instructor.firstName} {instructor.lastName}
                            </h3>
                            {getStatusBadge(instructor.accountStatus)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {instructor.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              {instructor.universityName}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(instructor.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              {locale === 'ar' ? 'التخصص: ' : 'Major: '}
                              {instructor.major}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInstructor(instructor)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(instructor.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {locale === 'ar' ? 'موافقة' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedInstructor(instructor)
                              setShowRejectModal(true)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {locale === 'ar' ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Instructors */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ar' ? 'جميع المعلمين' : 'All Instructors'} ({allInstructors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allInstructors.map((instructor) => (
                  <div key={instructor.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">
                          {instructor.firstName} {instructor.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{instructor.email}</p>
                      </div>
                      {getStatusBadge(instructor.accountStatus)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>
                    {locale === 'ar' ? 'رفض طلب المعلم' : 'Reject Instructor Application'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ar'
                      ? 'يرجى إدخال سبب الرفض (إلزامي)'
                      : 'Please provide a rejection reason (required)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rejectionReason">
                      {locale === 'ar' ? 'سبب الرفض *' : 'Rejection Reason *'}
                    </Label>
                    <textarea
                      id="rejectionReason"
                      className="w-full mt-2 px-3 py-2 border rounded-md"
                      rows={4}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={locale === 'ar' ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectModal(false)
                        setRejectionReason('')
                      }}
                    >
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button variant="destructive" onClick={handleReject}>
                      {locale === 'ar' ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
