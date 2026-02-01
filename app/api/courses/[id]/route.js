import { coursesDB } from '@/lib/db'
import { formatCourseDuration } from '@/lib/utils'

function totalDurationSecondsFromSections(sections) {
  if (!Array.isArray(sections)) return 0
  return sections.reduce((sum, section) => {
    const sectionSeconds = (section.videos || []).reduce((s, v) => s + (Number(v.duration) || 0), 0)
    return sum + sectionSeconds
  }, 0)
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    
    const course = await coursesDB.getById(id)
    
    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const totalSeconds = totalDurationSecondsFromSections(course.sections)
    const duration = totalSeconds > 0
      ? formatCourseDuration(totalSeconds)
      : (course.duration || '0 hours')
    const videosOnly = searchParams.get('videosOnly') === 'true'

    // Normalize section: support title as string or object, and ensure quizzes/articles/pdfs are arrays
    const getSectionTitle = (s) => {
      if (s.title == null) return ''
      if (typeof s.title === 'string') return s.title
      if (typeof s.title === 'object') return s.title[locale] || s.title.en || ''
      return ''
    }
    const getQuizzes = (s) => {
      const list = s.quizzes ?? s.Quizzes ?? []
      return Array.isArray(list) ? list : []
    }
    const getArticles = (s) => {
      const list = s.articles ?? s.Articles ?? []
      return Array.isArray(list) ? list : []
    }
    const getPdfs = (s) => {
      const list = s.pdfs ?? s.Pdfs ?? []
      return Array.isArray(list) ? list : []
    }
    // If section has unified "contents" array, use it to fill missing videos/quizzes/articles/pdfs
    const getSectionContentArrays = (section) => {
      let videos = section.videos ?? section.Videos ?? []
      let quizzes = getQuizzes(section)
      let articles = getArticles(section)
      let pdfs = getPdfs(section)
      if (Array.isArray(section.contents)) {
        if (quizzes.length === 0) quizzes = section.contents.filter((c) => c.type === 'quiz')
        if (articles.length === 0) articles = section.contents.filter((c) => c.type === 'article')
        if (pdfs.length === 0) pdfs = section.contents.filter((c) => c.type === 'pdf')
        if (videos.length === 0) videos = section.contents.filter((c) => c.type === 'video')
      }
      videos = Array.isArray(videos) ? videos : []
      quizzes = Array.isArray(quizzes) ? quizzes : []
      articles = Array.isArray(articles) ? articles : []
      pdfs = Array.isArray(pdfs) ? pdfs : []
      return { videos, quizzes, articles, pdfs }
    }

    const mapSection = (section) => {
      const { videos, quizzes, articles, pdfs } = getSectionContentArrays(section)
      return {
        ...section,
        title: getSectionTitle(section),
        videos: videos.map(video => ({
          ...video,
          title: typeof video.title === 'object' ? (video.title[locale] || video.title.en) : (video.title ?? ''),
          videoUrl: video.url ?? video.videoUrl,
          duration: video.duration ?? 0,
        })),
        quizzes: quizzes.map(q => ({
          ...q,
          title: typeof q.title === 'object' ? (q.title[locale] || q.title.en) : (q.title ?? ''),
        })),
        articles: articles.map(a => ({
          ...a,
          title: typeof a.title === 'object' ? (a.title[locale] || a.title.en) : (a.title ?? ''),
        })),
        pdfs: pdfs.map(p => ({
          ...p,
          title: typeof p.title === 'object' ? (p.title[locale] || p.title.en) : (p.title ?? ''),
        })),
      }
    }

    const sectionsRaw = Array.isArray(course.sections) ? course.sections : []
    // Student-facing: only videos in sections (no quiz/article/pdf). Instructor/preview gets full sections.
    const sections = videosOnly
      ? sectionsRaw.map(section => ({
          id: section.id,
          title: getSectionTitle(section),
          isFreePreview: section.isFreePreview || false,
          videos: (section.videos || []).map(video => ({
            ...video,
            title: typeof video.title === 'object' ? (video.title[locale] || video.title.en) : (video.title ?? ''),
            videoUrl: video.url ?? video.videoUrl,
            duration: video.duration ?? 0,
          })),
        }))
      : sectionsRaw.map(mapSection)

    const formattedCourse = {
      ...course,
      duration,
      title: course.title[locale] || course.title.en,
      description: course.description[locale] || course.description.en,
      sections,
    }

    return Response.json({ course: formattedCourse })
  } catch (error) {
    console.error('Get course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { requireAuth } = await import('@/lib/auth')
    const { coursesDB } = await import('@/lib/db')
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

    const { id } = params
    await coursesDB.delete(id)
    return Response.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
