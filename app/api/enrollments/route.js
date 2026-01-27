import { requireAuth } from '@/lib/auth'
import { enrollmentsDB, coursesDB } from '@/lib/db'

export async function GET(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const enrollments = await enrollmentsDB.getByUserId(authResult.user.id)
    const courses = await coursesDB.getAll()

    // Enrich enrollments with course data
    const enrichedEnrollments = enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId)
      return {
        ...enrollment,
        course: course ? {
          id: course.id,
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          thumbnail: course.thumbnail,
        } : null,
      }
    })

    return Response.json({ enrollments: enrichedEnrollments })
  } catch (error) {
    console.error('Get enrollments error:', error)
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

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return Response.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await coursesDB.getById(courseId)
    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if already enrolled
    const existing = await enrollmentsDB.getByUserAndCourse(authResult.user.id, courseId)
    if (existing) {
      return Response.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Create enrollment (in a real app, you'd process payment here)
    const enrollment = await enrollmentsDB.create({
      userId: authResult.user.id,
      courseId: courseId.toString(),
      status: 'active',
    })

    return Response.json({ enrollment }, { status: 201 })
  } catch (error) {
    console.error('Enroll error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
