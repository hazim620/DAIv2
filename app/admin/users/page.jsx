'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { UserCog } from 'lucide-react'

export default function AdminUsersPage() {
  const { locale } = useLanguage()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        }
      } catch (e) {
        console.error('Fetch users error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      } else {
        const data = await res.json()
        alert(data.error || 'Failed')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setUpdatingId(null)
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {locale === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
        </h1>
        <p className="text-gray-600">
          {locale === 'ar' ? 'عرض وتعديل الأدوار' : 'View and change user roles'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {locale === 'ar' ? 'جميع المستخدمين' : 'All Users'} ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'البريد' : 'Email'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'الدور' : 'Role'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">{locale === 'ar' ? 'تغيير الدور' : 'Change Role'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium">{u.name || '-'}</td>
                    <td className="border border-gray-200 px-3 py-2">{u.email}</td>
                    <td className="border border-gray-200 px-3 py-2">{u.role}</td>
                    <td className="border border-gray-200 px-3 py-2">{u.accountStatus || 'active'}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="student">{locale === 'ar' ? 'طالب' : 'Student'}</option>
                        <option value="instructor">{locale === 'ar' ? 'مدرب' : 'Instructor'}</option>
                        <option value="admin">{locale === 'ar' ? 'مدير' : 'Admin'}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-gray-500 py-6 text-center">{locale === 'ar' ? 'لا يوجد مستخدمون' : 'No users'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
