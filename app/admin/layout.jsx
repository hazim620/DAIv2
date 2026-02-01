'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { Navbar } from '@/components/navbar'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Tag,
  UserCog,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

const nav = [
  { href: '/admin', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/instructors', labelAr: 'المعلمين', labelEn: 'Instructors', icon: Users },
  { href: '/admin/courses/review', labelAr: 'مراجعة الدورات', labelEn: 'Course Review', icon: ClipboardList },
  { href: '/admin/courses/performance', labelAr: 'أداء الدورات', labelEn: 'Course Performance', icon: BookOpen },
  { href: '/admin/users', labelAr: 'المستخدمين', labelEn: 'Users', icon: UserCog },
  { href: '/admin/discounts', labelAr: 'الخصومات', labelEn: 'Discounts', icon: Tag },
]

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { locale } = useLanguage()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (user.role !== 'admin') {
      router.replace(user?.role === 'instructor' ? '/instructor' : '/dashboard')
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <aside
          className={`w-56 border-r border-gray-200 bg-white shrink-0 flex flex-col ${
            locale === 'ar' ? 'border-l' : 'border-r'
          }`}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          <nav className="p-3 space-y-1">
            {nav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              const Label = locale === 'ar' ? item.labelAr : item.labelEn
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{Label}</span>
                  {locale === 'ar' ? (
                    <ChevronLeft className="h-4 w-4 opacity-70" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
