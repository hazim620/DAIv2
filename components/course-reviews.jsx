'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { Star, MessageSquare } from 'lucide-react'

export function CourseReviews({ courseId }) {
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?courseId=${courseId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          rating: formData.rating,
          comment: formData.comment,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ rating: 5, comment: '' })
        fetchReviews()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review')
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {locale === 'ar' ? 'التقييمات' : 'Reviews'}
            {reviews.length > 0 && (
              <span className="text-lg font-normal text-gray-600">
                ({averageRating} ⭐ - {reviews.length} {locale === 'ar' ? 'تقييم' : 'reviews'})
              </span>
            )}
          </CardTitle>
          {user && (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm 
                ? (locale === 'ar' ? 'إلغاء' : 'Cancel')
                : (locale === 'ar' ? 'إضافة تقييم' : 'Add Review')
              }
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'التقييم' : 'Rating'}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= formData.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">{locale === 'ar' ? 'التعليق' : 'Comment'}</Label>
              <Input
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder={locale === 'ar' ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
              />
            </div>
            <Button type="submit">{locale === 'ar' ? 'إرسال' : 'Submit'}</Button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-600">{t('loading')}</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>{locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
