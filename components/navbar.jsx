'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, BookOpen, Shield } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { locale, t } = useLanguage()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              DAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('home')}
              </Link>
              <Link href="/courses" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('courses')}
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('about')}
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                {t('contact')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('myCourses')}
                  </DropdownMenuItem>
                  {(user.role === 'instructor' || user.role === 'admin') && (
                    <DropdownMenuItem onClick={() => router.push('/instructor')}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      {locale === 'ar' ? 'لوحة المدرب' : 'Instructor Dashboard'}
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      {locale === 'ar' ? 'لوحة المدير' : 'Admin Panel'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('profile') || 'Profile'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">{t('login')}</Button>
                </Link>
                <Link href="/signup">
                  <Button>{t('signup')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
