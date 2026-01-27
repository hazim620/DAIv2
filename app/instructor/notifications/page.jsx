'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { Bell, Check, CheckCheck, Mail, FileText, DollarSign, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, system, course, financial

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchNotifications()
  }, [user, router, filter])

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams()
      if (filter === 'unread') {
        params.append('unreadOnly', 'true')
      } else if (filter !== 'all') {
        params.append('type', filter)
      }

      const res = await fetch(`/api/notifications?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId, read: true }),
      })

      if (res.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      await Promise.all(unreadIds.map(id => markAsRead(id)))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      system: Bell,
      course: FileText,
      financial: DollarSign,
      admin_comment: AlertCircle,
    }
    const Icon = icons[type] || Bell
    return <Icon className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h1>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All as Read'}
                </Button>
                <span className="text-sm text-gray-600">
                  {unreadCount} {locale === 'ar' ? 'غير مقروء' : 'unread'}
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {locale === 'ar' ? 'الكل' : 'All'}
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              {locale === 'ar' ? 'غير مقروء' : 'Unread'}
            </Button>
            <Button
              variant={filter === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('system')}
            >
              {locale === 'ar' ? 'نظام' : 'System'}
            </Button>
            <Button
              variant={filter === 'course' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('course')}
            >
              {locale === 'ar' ? 'دورة' : 'Course'}
            </Button>
            <Button
              variant={filter === 'financial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('financial')}
            >
              {locale === 'ar' ? 'مالي' : 'Financial'}
            </Button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !notification.read ? 'border-l-4 border-l-primary bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    if (notification.link) {
                      router.push(notification.link)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${
                        notification.type === 'system' ? 'text-blue-600' :
                        notification.type === 'course' ? 'text-green-600' :
                        notification.type === 'financial' ? 'text-yellow-600' :
                        'text-purple-600'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
