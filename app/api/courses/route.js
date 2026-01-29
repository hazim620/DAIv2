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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    
    const courses = await coursesDB.getAll()
    
    // Format courses for the requested locale
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
