import { requireAdmin } from '@/lib/auth'
import { coursesDB, courseStatusHistoryDB, courseSubmissionsDB } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(request, { params }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    const user = authResult.user
    const { id } = params
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || ''

    if (!reason.trim()) {
      return Response.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const course = await coursesDB.getById(id)
    if (!course) {
      return Response.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.status !== 'submitted_for_review' && course.status !== 'approved') {
      return Response.json(
        { error: `Course cannot be rejected. Current status: ${course.status}` },
        { status: 400 }
      )
    }

    await coursesDB.update(id, { status: 'rejected' })

    await courseStatusHistoryDB.create({
      courseId: id,
      status: 'rejected',
      changedBy: user.id,
      changedByRole: user.role,
      reason: reason.trim(),
    })

    const submissions = await courseSubmissionsDB.getByCourseId(id)
    const pending = submissions.find((s) => s.status === 'submitted_for_review')
    if (pending) {
      await courseSubmissionsDB.update(pending.id, { status: 'rejected' })
    }

    const titleStr = typeof course.title === 'object' ? course.title?.en || course.title?.ar : course.title
    const notificationMessage = `Your course "${titleStr}" was rejected.\n\nRejection reason: ${reason.trim()}`
    await createNotification(
      course.instructorId,
      'course',
      'Course Rejected',
      notificationMessage,
      `/instructor/courses/${id}`
    )

    return Response.json({
      success: true,
      message: 'Course rejected. Instructor has been notified.',
    })
  } catch (error) {
    console.error('Reject course error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
