import { requireAuth } from '@/lib/auth'
import { coursesDB } from '@/lib/db'
import { formatCourseDuration } from '@/lib/utils'

function totalDurationSecondsFromSections(sections) {
  if (!Array.isArray(sections)) return 0
  return sections.reduce((sum, section) => {
    const sectionSeconds = (section.videos || []).reduce((s, v) => s + (Number(v.duration) || 0), 0)
    return sum + sectionSeconds
  }, 0)
}

function formatCourseForList(course) {
  const duration = course.duration || formatCourseDuration(totalDurationSecondsFromSections(course.sections))
  return {
    id: course.id,
    instructorId: course.instructorId,
    instructor: course.instructor,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    category: course.category,
    level: course.level,
    language: course.language,
    price: course.price,
    thumbnail: course.thumbnail,
    duration,
    students: course.students,
    status: course.status,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }
}

function matchesCategory(course, category) {
  if (!category || category === 'all') return true
  const cat = (course.category || '').toLowerCase()
  const title = typeof course.title === 'object' ? `${course.title.en || ''} ${course.title.ar || ''}` : (course.title || '')
  const desc = typeof course.description === 'object' ? `${course.description.en || ''} ${course.description.ar || ''}` : (course.description || '')
  const text = `${cat} ${title} ${desc}`.toLowerCase()
  if (category === 'data-science' && (text.includes('data') || text.includes('بيانات'))) return true
  if (category === 'ai' && (text.includes('ai') || text.includes('ذكاء') || text.includes('artificial'))) return true
  if (category === 'python' && (text.includes('python') || text.includes('بايثون'))) return true
  return false
}

function matchesSearch(course, q, locale) {
  if (!q || !q.trim()) return true
  const query = q.trim().toLowerCase()
  const title = typeof course.title === 'object' ? (course.title[locale] || course.title.en || course.title.ar || '') : (course.title || '')
  const desc = typeof course.description === 'object' ? (course.description[locale] || course.description.en || course.description.ar || '') : (course.description || '')
  const instructor = (course.instructor || '').toLowerCase()
  return title.toLowerCase().includes(query) || desc.toLowerCase().includes(query) || instructor.includes(query)
}

function matchesLevel(course, level) {
  if (!level || level === 'all') return true
  const l = (course.level || '').toLowerCase()
  return l === level.toLowerCase()
}

function matchesPrice(course, priceFilter) {
  if (!priceFilter || priceFilter === 'all') return true
  const p = course.price != null ? Number(course.price) : 0
  if (priceFilter === 'free') return p === 0
  if (priceFilter === 'paid') return p > 0
  return true
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const listOnly = searchParams.get('list') === '1'
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit'), 10) || 12), 48)
    const offset = Math.max(0, parseInt(searchParams.get('offset'), 10) || 0)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || 'all'
    const level = searchParams.get('level') || 'all'
    const price = searchParams.get('price') || 'all'
    const sort = searchParams.get('sort') || 'newest'

    const courses = await coursesDB.getAll()

    if (listOnly) {
      const usePagination = searchParams.has('limit') || searchParams.has('offset')

      if (!usePagination) {
        // Homepage etc: return all courses (no pagination)
        const formattedCourses = courses.map(course => formatCourseForList(course))
        return Response.json({ courses: formattedCourses })
      }

      // /courses page: filter, sort, paginate
      let list = courses.map(course => formatCourseForList(course))
      list = list.filter(c => matchesCategory(c, category) && matchesSearch(c, q, locale) && matchesLevel(c, level) && matchesPrice(c, price))

      if (sort === 'popular') list.sort((a, b) => (b.students || 0) - (a.students || 0))
      else if (sort === 'price-asc') list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
      else if (sort === 'price-desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
      else list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

      const total = list.length
      const paginated = list.slice(offset, offset + limit)
      const hasMore = offset + paginated.length < total
      return Response.json({ courses: paginated, total, hasMore })
    }

    // Full payload with sections and locale-formatted titles
    const formattedCourses = courses.map(course => {
      const duration = course.duration || formatCourseDuration(totalDurationSecondsFromSections(course.sections))
      return {
        ...course,
        duration,
        title: course.title[locale] || course.title.en,
        description: course.description[locale] || course.description.en,
        sections: course.sections.map(section => ({
          ...section,
          title: section.title[locale] || section.title.en,
          videos: (section.videos || []).map(video => ({
            ...video,
            title: video.title[locale] || video.title.en,
          })),
        })),
      }
    })

    return Response.json({ courses: formattedCourses })
  } catch (error) {
    console.error('Get courses error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const course = await coursesDB.create(body)

    return Response.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')

    if (!courseId) {
      return Response.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    await coursesDB.delete(courseId)
    return Response.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
