import { coursesDB } from '@/lib/db'
import { formatCourseDuration } from '@/lib/utils'

const cache = new Map()
const CACHE_TTL_MS = 60_000
const MIN_LATENCY_MS = 500
const MAX_LATENCY_MS = 800

function totalDurationSecondsFromSections(sections) {
  if (!Array.isArray(sections)) return 0
  return sections.reduce((sum, section) => {
    const sectionSeconds = (section.videos || []).reduce((s, v) => s + (Number(v.duration) || 0), 0)
    return sum + sectionSeconds
  }, 0)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function searchCourses(courses, q, locale) {
  if (!q || !q.trim()) return courses.slice(0, 12)
  const query = q.trim().toLowerCase()
  const titleStr = (t) => (typeof t === 'object' ? (t[locale] || t.en || t.ar || '') : t || '')
  return courses
    .filter((c) => {
      const title = titleStr(c.title)
      const desc = titleStr(c.description)
      const cat = (c.category || '').toLowerCase()
      return (
        title.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        cat.includes(query)
      )
    })
    .slice(0, 12)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const locale = searchParams.get('locale') || 'en'
    const cacheKey = `${locale}:${q}`

    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return Response.json(cached.data)
    }

    const latency = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
    await delay(latency)

    let courses = []
    try {
      const raw = await coursesDB.getAll()
      const duration = (c) =>
        c.duration || formatCourseDuration(totalDurationSecondsFromSections(c.sections))
      courses = raw.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        shortDescription: c.short_description || (typeof c.description === 'object' ? c.description?.[locale] || c.description?.en : c.description),
        instructor: c.instructor,
        category: c.category,
        level: c.level,
        duration: duration(c),
        thumbnail: c.thumbnail,
        price: c.price != null ? parseFloat(c.price) : 0,
        students: c.students || 0,
        rating: 4.2 + Math.random() * 0.8,
      }))
    } catch (err) {
      console.error('Search courses DB error:', err)
      courses = [
        {
          id: '1',
          title: locale === 'ar' ? 'مقدمة في علوم البيانات' : 'Introduction to Data Science',
          description: locale === 'ar' ? 'أساسيات تحليل البيانات' : 'Fundamentals of data analysis',
          shortDescription: locale === 'ar' ? 'أساسيات تحليل البيانات' : 'Fundamentals of data analysis',
          instructor: 'DAI Team',
          category: 'Data Science',
          level: 'Beginner',
          duration: '10h',
          thumbnail: null,
          students: 1200,
          rating: 4.5,
        },
        {
          id: '2',
          title: locale === 'ar' ? 'الذكاء الاصطناعي التطبيقي' : 'Applied AI',
          description: locale === 'ar' ? 'تطبيقات عملية للذكاء الاصطناعي' : 'Practical AI applications',
          shortDescription: locale === 'ar' ? 'تطبيقات عملية' : 'Practical applications',
          instructor: 'DAI Team',
          category: 'AI',
          level: 'Intermediate',
          duration: '15h',
          thumbnail: null,
          students: 800,
          rating: 4.7,
        },
      ]
    }

    const results = searchCourses(courses, q, locale)
    const data = { courses: results, query: q }
    cache.set(cacheKey, { data, at: Date.now() })
    return Response.json(data)
  } catch (error) {
    console.error('Search API error:', error)
    return Response.json({ courses: [], query: '' }, { status: 500 })
  }
}
