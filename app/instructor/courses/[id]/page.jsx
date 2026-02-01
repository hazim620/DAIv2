'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import NewCoursePage from '@/app/instructor/courses/new/page'

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [initialFormData, setInitialFormData] = useState(null)
  const [initialCourseStatus, setInitialCourseStatus] = useState(null)
  const [initialAdminComments, setInitialAdminComments] = useState([])

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return null
  }

  useEffect(() => {
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      router.replace('/login')
    }
  }, [user, router])

  useEffect(() => {
    const load = async () => {
      if (!courseId || courseId === 'new') return
      setLoading(true)
      try {
        // base course
        const res = await fetch(`/api/instructor/courses/${courseId}`, { credentials: 'include' })
        if (!res.ok) {
          setInitialFormData(null)
          return
        }
        const data = await res.json()
        const course = data.course

        // draft (if exists)
        let draftData = null
        try {
          const draftRes = await fetch(`/api/instructor/courses/${courseId}/draft`, { credentials: 'include' })
          if (draftRes.ok) {
            const draftJson = await draftRes.json()
            const raw = draftJson?.draft?.draftData
            if (raw) {
              draftData = typeof raw === 'string' ? JSON.parse(raw) : raw
            }
          }
        } catch (e) {
          // ignore draft fetch errors
        }

        setInitialCourseStatus(course?.status || null)
        const submission = data.submission
        if (submission?.adminComments?.length) {
          setInitialAdminComments(Array.isArray(submission.adminComments) ? submission.adminComments : [])
        } else {
          setInitialAdminComments([])
        }
        const source = draftData || course
        const title = typeof source.title === 'object' ? (source.title[locale] || source.title.en || '') : (source.title || '')
        const description = typeof source.description === 'object' ? (source.description[locale] || source.description.en || '') : (source.description || '')

        // Normalize sections so section and content titles are always { en, ar } (editable)
        const rawSections = Array.isArray(source.sections) ? source.sections : []
        const sections = rawSections.map((sec) => {
          const sectionTitle = typeof sec.title === 'object' && sec.title != null
            ? { en: sec.title.en ?? '', ar: sec.title.ar ?? '' }
            : { en: String(sec.title ?? ''), ar: String(sec.title ?? '') }
          const normalizeTitle = (t) =>
            typeof t === 'object' && t != null ? { en: t.en ?? '', ar: t.ar ?? '' } : { en: String(t ?? ''), ar: String(t ?? '') }
          return {
            ...sec,
            title: sectionTitle,
            videos: (sec.videos || []).map((v) => ({ ...v, title: normalizeTitle(v.title) })),
            quizzes: (sec.quizzes || []).map((q) => ({ ...q, title: normalizeTitle(q.title) })),
            articles: (sec.articles || []).map((a) => ({ ...a, title: normalizeTitle(a.title) })),
            pdfs: (sec.pdfs || []).map((p) => ({ ...p, title: normalizeTitle(p.title) })),
          }
        })

        setInitialFormData({
          title,
          shortDescription: source.shortDescription || '',
          description,
          category: source.category || 'general',
          level: source.level || 'beginner',
          language: source.language || 'ar',
          price: source.price || 0,
          thumbnail: source.thumbnail || '',
          sections,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, locale])

  if (loading || !initialFormData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <NewCoursePage
      initialCourseId={courseId}
      initialFormData={initialFormData}
      initialStep={1}
      initialCourseStatus={initialCourseStatus}
      initialAdminComments={initialAdminComments}
    />
  )
}
