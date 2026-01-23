'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { MessageSquare, Heart, Reply } from 'lucide-react'

export function CourseDiscussions({ courseId }) {
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [replyForms, setReplyForms] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })
  const [replies, setReplies] = useState({})

  useEffect(() => {
    fetchDiscussions()
  }, [courseId])

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(`/api/discussions?courseId=${courseId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setDiscussions(data.discussions || [])
      }
    } catch (error) {
      console.error('Error fetching discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitDiscussion = async (e) => {
    e.preventDefault()
    if (!user) {
      alert(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          title: formData.title,
          content: formData.content,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ title: '', content: '' })
        fetchDiscussions()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create discussion')
      }
    } catch (error) {
      console.error('Error creating discussion:', error)
      alert('Error creating discussion')
    }
  }

  const handleSubmitReply = async (discussionId, replyContent) => {
    if (!user) {
      alert(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          discussionId,
          reply: replyContent,
        }),
      })

      if (response.ok) {
        setReplyForms({ ...replyForms, [discussionId]: false })
        setReplies({ ...replies, [discussionId]: '' })
        fetchDiscussions()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit reply')
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Error submitting reply')
    }
  }

  const handleToggleLike = async (discussionId) => {
    if (!user) {
      alert(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          discussionId,
          action: 'like',
        }),
      })

      if (response.ok) {
        fetchDiscussions()
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {locale === 'ar' ? 'المناقشات' : 'Discussions'}
            {discussions.length > 0 && (
              <span className="text-lg font-normal text-gray-600">
                ({discussions.length} {locale === 'ar' ? 'مناقشة' : 'discussions'})
              </span>
            )}
          </CardTitle>
          {user && (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm
                ? (locale === 'ar' ? 'إلغاء' : 'Cancel')
                : (locale === 'ar' ? 'بدء مناقشة' : 'Start Discussion')
              }
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmitDiscussion} className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{locale === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={locale === 'ar' ? 'عنوان المناقشة...' : 'Discussion title...'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{locale === 'ar' ? 'المحتوى' : 'Content'}</Label>
              <Input
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={locale === 'ar' ? 'اكتب محتوى المناقشة...' : 'Write discussion content...'}
                required
              />
            </div>
            <Button type="submit">{locale === 'ar' ? 'إرسال' : 'Submit'}</Button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-600">{t('loading')}</p>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>{locale === 'ar' ? 'لا توجد مناقشات بعد' : 'No discussions yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion) => {
              const isLiked = discussion.likes?.includes(user?.id) || false

              return (
                <div key={discussion.id} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{discussion.title}</h3>
                        <p className="text-sm text-gray-500">
                          {discussion.user?.name || 'Anonymous'} • {new Date(discussion.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{discussion.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => handleToggleLike(discussion.id)}
                      className={`flex items-center gap-1 text-sm ${
                        isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
                      {discussion.likesCount || 0}
                    </button>
                    <span className="text-sm text-gray-600">
                      {discussion.replies?.length || 0} {locale === 'ar' ? 'رد' : 'replies'}
                    </span>
                  </div>

                  {/* Replies */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="ml-4 mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-semibold text-sm">{reply.user?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-gray-700">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {user && (
                    <div className="mt-3">
                      {replyForms[discussion.id] ? (
                        <div className="space-y-2">
                          <Input
                            value={replies[discussion.id] || ''}
                            onChange={(e) => setReplies({ ...replies, [discussion.id]: e.target.value })}
                            placeholder={locale === 'ar' ? 'اكتب ردك...' : 'Write your reply...'}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(discussion.id, replies[discussion.id])}
                            >
                              {locale === 'ar' ? 'إرسال' : 'Submit'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyForms({ ...replyForms, [discussion.id]: false })
                                setReplies({ ...replies, [discussion.id]: '' })
                              }}
                            >
                              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyForms({ ...replyForms, [discussion.id]: true })}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          {locale === 'ar' ? 'رد' : 'Reply'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
