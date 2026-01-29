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

    const duration = course.duration || formatCourseDuration(totalDurationSecondsFromSections(course.sections))
    const videosOnly = searchParams.get('videosOnly') === 'true'

    const mapSection = (section) => ({
      ...section,
      title: section.title[locale] || section.title.en,
      videos: (section.videos || []).map(video => ({
        ...video,
        title: video.title[locale] || video.title.en,
        videoUrl: video.url ?? video.videoUrl,
        duration: video.duration ?? 0,
      })),
    })

    // Student-facing: only videos in sections (no quiz/article/pdf). Instructor/preview gets full sections.
    const sections = videosOnly
      ? course.sections.map(section => ({
          id: section.id,
          title: section.title[locale] || section.title.en,
          isFreePreview: section.isFreePreview || false,
          videos: (section.videos || []).map(video => ({
            ...video,
            title: video.title[locale] || video.title.en,
            videoUrl: video.url ?? video.videoUrl,
            duration: video.duration ?? 0,
          })),
        }))
      : course.sections.map(mapSection)

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
