'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { Tag, Plus, Trash2 } from 'lucide-react'

export default function AdminDiscountsPage() {
  const { locale } = useLanguage()
  const [codes, setCodes] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    instructorId: '',
    code: '',
    discountPercent: 10,
    startDate: '',
    endDate: '',
    maxUses: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [codesRes, instructorsRes] = await Promise.all([
          fetch('/api/admin/discounts', { credentials: 'include' }),
          fetch('/api/admin/instructors', { credentials: 'include' }),
        ])
        if (codesRes.ok) {
          const data = await codesRes.json()
          setCodes(data.codes || [])
        }
        if (instructorsRes.ok) {
          const data = await instructorsRes.json()
          const approved = (data.instructors || []).filter((i) => i.accountStatus === 'approved')
          setInstructors(approved)
        }
      } catch (e) {
        console.error('Fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.instructorId || !formData.code?.trim()) {
      alert(locale === 'ar' ? 'المدرب والكود مطلوبان' : 'Instructor and code are required')
      return
    }
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instructorId: formData.instructorId,
          code: formData.code.trim(),
          discountPercent: formData.discountPercent,
          startDate: formData.startDate,
          endDate: formData.endDate,
          maxUses: formData.maxUses || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCodes((prev) => [data.code, ...prev])
        setShowForm(false)
        setFormData({ instructorId: '', code: '', discountPercent: 10, startDate: '', endDate: '', maxUses: '' })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed')
      }
    } catch (e) {
      alert('Network error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الكود؟' : 'Are you sure you want to delete this discount code?')) {
      return
    }
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setCodes((prev) => prev.filter((c) => c.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || (locale === 'ar' ? 'فشل الحذف' : 'Delete failed'))
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {locale === 'ar' ? 'إدارة الخصومات' : 'Discount Management'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar' ? 'عرض وإنشاء أكواد الخصم' : 'View and create discount codes'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {locale === 'ar' ? 'كود جديد' : 'New Code'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {locale === 'ar' ? 'إنشاء كود خصم' : 'Create Discount Code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <Label>{locale === 'ar' ? 'المدرب' : 'Instructor'}</Label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => setFormData((f) => ({ ...f, instructorId: e.target.value }))}
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                >
                  <option value="">{locale === 'ar' ? 'اختر المدرب' : 'Select instructor'}</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name || i.firstName + ' ' + i.lastName || i.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{locale === 'ar' ? 'الكود' : 'Code'}</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value }))}
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div>
                <Label>{locale === 'ar' ? 'نسبة الخصم (%)' : 'Discount %'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={25}
                  value={formData.discountPercent}
                  onChange={(e) => setFormData((f) => ({ ...f, discountPercent: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{locale === 'ar' ? 'من تاريخ' : 'Start date'}</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>{locale === 'ar' ? 'إلى تاريخ' : 'End date'}</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>{locale === 'ar' ? 'الحد الأقصى للاستخدام (اختياري)' : 'Max uses (optional)'}</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxUses}
                  onChange={(e) => setFormData((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder={locale === 'ar' ? 'غير محدود' : 'Unlimited'}
                />
              </div>
              <Button type="submit">{locale === 'ar' ? 'إنشاء' : 'Create'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {locale === 'ar' ? 'أكواد الخصم' : 'Discount Codes'} ({codes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'الكود' : 'Code'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'المدرب' : 'Instructor'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-right font-medium">%</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'من' : 'From'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'إلى' : 'To'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-right font-medium">{locale === 'ar' ? 'المستخدم' : 'Used'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium w-20">{locale === 'ar' ? 'حذف' : 'Delete'}</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium">{c.code}</td>
                    <td className="border border-gray-200 px-3 py-2">{c.instructorName || c.instructorId}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{c.discountPercent}%</td>
                    <td className="border border-gray-200 px-3 py-2">{c.startDate}</td>
                    <td className="border border-gray-200 px-3 py-2">{c.endDate}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{c.usedCount} / {c.maxUses ?? '∞'}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === c.id}
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {codes.length === 0 && (
            <p className="text-gray-500 py-6 text-center">{locale === 'ar' ? 'لا توجد أكواد خصم' : 'No discount codes'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
