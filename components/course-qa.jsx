'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { MessageSquare, HelpCircle } from 'lucide-react'

export function CourseQA({ courseId }) {
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [qas, setQas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [answerForms, setAnswerForms] = useState({})
  const [questionText, setQuestionText] = useState('')
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    fetchQAs()
  }, [courseId])

  const fetchQAs = async () => {
    try {
      const response = await fetch(`/api/qa?courseId=${courseId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setQas(data.qas || [])
      }
    } catch (error) {
      console.error('Error fetching Q&A:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!user) {
      alert(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          question: questionText,
        }),
      })

      if (response.ok) {
        setShowQuestionForm(false)
        setQuestionText('')
        fetchQAs()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit question')
      }
    } catch (error) {
      console.error('Error submitting question:', error)
      alert('Error submitting question')
    }
  }

  const handleSubmitAnswer = async (questionId, answerText) => {
    if (!user) {
      alert(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          questionId,
          answer: answerText,
        }),
      })

      if (response.ok) {
        setAnswerForms({ ...answerForms, [questionId]: false })
        setAnswers({ ...answers, [questionId]: '' })
        fetchQAs()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit answer')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Error submitting answer')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {locale === 'ar' ? 'الأسئلة والأجوبة' : 'Q&A'}
            {qas.length > 0 && (
              <span className="text-lg font-normal text-gray-600">
                ({qas.length} {locale === 'ar' ? 'سؤال' : 'questions'})
              </span>
            )}
          </CardTitle>
          {user && (
            <Button onClick={() => setShowQuestionForm(!showQuestionForm)} size="sm">
              {showQuestionForm
                ? (locale === 'ar' ? 'إلغاء' : 'Cancel')
                : (locale === 'ar' ? 'طرح سؤال' : 'Ask Question')
              }
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showQuestionForm && (
          <form onSubmit={handleSubmitQuestion} className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">{locale === 'ar' ? 'السؤال' : 'Question'}</Label>
              <Input
                id="question"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={locale === 'ar' ? 'اكتب سؤالك هنا...' : 'Write your question here...'}
                required
              />
            </div>
            <Button type="submit">{locale === 'ar' ? 'إرسال' : 'Submit'}</Button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-600">{t('loading')}</p>
        ) : qas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>{locale === 'ar' ? 'لا توجد أسئلة بعد' : 'No questions yet'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {qas.map((qa) => (
              <div key={qa.id} className="border rounded-lg p-4">
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{qa.user?.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(qa.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-800 font-medium">{qa.question}</p>
                </div>

                {/* Answers */}
                {qa.answers && qa.answers.length > 0 && (
                  <div className="ml-4 mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
                    {qa.answers.map((answer) => (
                      <div key={answer.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-sm">{answer.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(answer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-700">{answer.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Form */}
                {user && (
                  <div className="mt-4">
                    {answerForms[qa.id] ? (
                      <div className="space-y-2">
                        <Input
                          value={answers[qa.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [qa.id]: e.target.value })}
                          placeholder={locale === 'ar' ? 'اكتب إجابتك...' : 'Write your answer...'}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitAnswer(qa.id, answers[qa.id])}
                          >
                            {locale === 'ar' ? 'إرسال' : 'Submit'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAnswerForms({ ...answerForms, [qa.id]: false })
                              setAnswers({ ...answers, [qa.id]: '' })
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
                        onClick={() => setAnswerForms({ ...answerForms, [qa.id]: true })}
                      >
                        {locale === 'ar' ? 'إضافة إجابة' : 'Add Answer'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
