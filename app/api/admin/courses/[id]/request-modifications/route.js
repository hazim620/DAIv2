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
    const comment = body.comment || body.reason || ''

    if (!comment.trim()) {
      return Response.json(
        { error: 'Modification comment is required' },
        { status: 400 }
      )
    }

    const course = await coursesDB.getById(id)
    if (!course) {
      return Response.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.status !== 'submitted_for_review' && course.status !== 'approved') {
      return Response.json(
        { error: `Course cannot be sent for modifications. Current status: ${course.status}` },
        { status: 400 }
      )
    }

    await coursesDB.update(id, { status: 'need_modification' })

    await courseStatusHistoryDB.create({
      courseId: id,
      status: 'need_modification',
      changedBy: user.id,
      changedByRole: user.role,
      reason: comment.trim(),
    })

    const submissions = await courseSubmissionsDB.getByCourseId(id)
    const pending = submissions.find((s) => s.status === 'submitted_for_review')
    if (pending) {
      const adminComments = Array.isArray(pending.adminComments) ? [...pending.adminComments] : []
      adminComments.push({
        id: Date.now().toString(),
        authorId: user.id,
        authorRole: 'admin',
        text: comment.trim(),
        createdAt: new Date().toISOString(),
      })
      await courseSubmissionsDB.update(pending.id, {
        status: 'need_modification',
        adminComments,
      })
    }

    const titleStr = typeof course.title === 'object' ? course.title?.en || course.title?.ar : course.title
    const notificationMessage = `Your course "${titleStr}" has been sent back for modifications.\n\nReason / Admin comment: ${comment.trim()}`
    await createNotification(
      course.instructorId,
      'course',
      'Modifications Requested',
      notificationMessage,
      `/instructor/courses/${id}`
    )

    return Response.json({
      success: true,
      message: 'Course sent back for modifications. Instructor has been notified.',
    })
  } catch (error) {
    console.error('Request modifications error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
