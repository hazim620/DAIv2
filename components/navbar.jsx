'use client'

import { useRef } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useSearch } from '@/contexts/search-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, BookOpen, Shield, Search, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export function Navbar({ overVideo = false }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { locale, t } = useLanguage()
  const { open: openSearch } = useSearch()
  const { theme, toggleTheme } = useTheme()
  const searchTriggerRef = useRef(null)

  const handleSearchClick = () => {
    const rect = searchTriggerRef.current?.getBoundingClientRect?.()
    openSearch(rect || null)
  }

  const handleLogout = async () => {
    await logout()
  }

  const linkClass = overVideo
    ? 'text-base font-medium text-white/95 hover:text-white transition-colors md:text-lg'
    : 'text-base font-medium text-gray-700 hover:text-primary transition-colors md:text-lg dark:text-gray-200 dark:hover:text-primary-foreground'

  return (
    <nav
      className={
        overVideo
          ? 'absolute top-0 left-0 right-0 z-20 border-b border-transparent bg-transparent py-2 transition-colors duration-300 hover:bg-black/60 hover:border-white/10 md:py-3'
          : 'border-b bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800'
      }
    >
      <div className="container mx-auto px-4">
        <div className="relative flex h-20 items-center justify-between md:h-24">
          {/* Left: nav links */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            <Link
              href={user?.role === 'admin' ? '/admin' : user && user.role === 'instructor' ? '/instructor' : (user ? '/dashboard' : '/')}
              className={linkClass}
            >
              {user?.role === 'admin' ? (locale === 'ar' ? 'لوحة المدير' : 'Admin') : user && user.role === 'instructor' ? (locale === 'ar' ? 'لوحة التحكم' : 'Dashboard') : t('home')}
            </Link>
            <Link href="/courses" className={linkClass}>
              {t('courses')}
            </Link>
            <Link href="/about" className={linkClass}>
              {t('about')}
            </Link>
            <Link href="/contact" className={linkClass}>
              {t('contact')}
            </Link>
          </div>
          {/* Center: logo */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex justify-center">
            <Link href="/" className="flex items-center shrink-0">
              <NextImage
                src="/logo.png"
                alt="DAi"
                width={300}
                height={100}
                className={`h-12 w-auto object-contain md:h-20 ${overVideo ? 'brightness-0 invert' : ''}`}
                priority
              />
            </Link>
          </div>
          {/* Right: search + auth */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center justify-center rounded-full p-2 transition-colors ${
                overVideo
                  ? 'text-white/90 hover:bg-white/20 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
              aria-label={theme === 'dark' ? (locale === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (locale === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={handleSearchClick}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-left w-40 max-w-[180px] transition-colors ${
                overVideo
                  ? 'border-white/50 bg-white/10 text-white/90 placeholder-white/70 hover:bg-white/20'
                  : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-label={locale === 'ar' ? 'بحث الدورات' : 'Search courses'}
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {locale === 'ar' ? 'بحث...' : 'Search...'}
              </span>
              <kbd className="hidden sm:inline ml-auto text-xs opacity-60 border rounded px-1.5 py-0.5" aria-hidden>⌘K</kbd>
            </button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`text-base md:text-lg ${overVideo ? 'text-white hover:bg-white/10 hover:text-white' : 'flex items-center gap-2 dark:hover:bg-gray-800'}`}
                  >
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
                  {user.role === 'instructor' && (
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
                  <Button variant="ghost" className={`text-base md:text-lg ${overVideo ? 'text-white hover:bg-white/10 hover:text-white' : 'dark:hover:bg-gray-800'}`}>
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className={`text-base md:text-lg ${overVideo ? 'border border-white/80 bg-transparent text-white hover:bg-white/20' : 'dark:bg-primary dark:hover:bg-primary/90'}`}>
                    {t('signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
