import { requireAdmin } from '@/lib/auth'
import { coursesDB, courseSubmissionsDB, usersDB } from '@/lib/db'

// List courses submitted for review (new or update)
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const submissions = await courseSubmissionsDB.getAll()
    const coursesSubmitted = await Promise.all(
      submissions
        .filter((s) => s.status === 'submitted_for_review')
        .map(async (s) => {
          const course = await coursesDB.getById(s.courseId)
          if (!course) return null
          const instructor = course.instructorId ? await usersDB.getById(course.instructorId) : null
          const title = typeof course.title === 'object' ? course.title?.en || course.title?.ar : course.title
          const isUpdate = course.version > 1 || course.parentCourseId
          return {
            submissionId: s.id,
            courseId: course.id,
            title,
            instructorName: course.instructor || instructor?.name,
            instructorId: course.instructorId,
            status: course.status,
            isUpdate,
            version: course.version || 1,
            submittedAt: s.submittedAt,
          }
        })
    )

    const list = coursesSubmitted.filter(Boolean)
    return Response.json({ submissions: list })
  } catch (error) {
    console.error('Admin submissions error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
