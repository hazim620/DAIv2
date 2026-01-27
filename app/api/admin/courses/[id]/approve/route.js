import { requireAuth } from '@/lib/auth'
import { coursesDB, courseStatusHistoryDB } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    
    if (user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const course = await coursesDB.getById(id)

    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.status !== 'submitted_for_review' && course.status !== 'approved') {
      return Response.json(
        { error: `Course cannot be approved. Current status: ${course.status}` },
        { status: 400 }
      )
    }

    // If this is a new version (v2+) and there's a published version, replace it
    if (course.version > 1 && course.parentCourseId) {
      const parentCourse = await coursesDB.getById(course.parentCourseId)
      
      if (parentCourse && parentCourse.status === 'published') {
        // Mark old version as archived
        await coursesDB.update(course.parentCourseId, {
          status: 'archived',
          isCurrentVersion: false,
        })

        // Mark new version as published and current
        await coursesDB.update(id, {
          status: 'published',
          isCurrentVersion: true,
        })

        // Create status history
        await courseStatusHistoryDB.create({
          courseId: id,
          status: 'published',
          changedBy: user.id,
          changedByRole: user.role,
          reason: `Version ${course.version} approved and replaced version ${course.version - 1}`,
        })

        // Notify instructor
        await createNotification(
          course.instructorId,
          'course',
          'Course Published',
          `Your course "${typeof course.title === 'object' ? course.title.en : course.title}" version ${course.version} has been approved and published.`,
          `/instructor/courses/${id}`
        )

        return Response.json({
          success: true,
          message: `Course version ${course.version} approved and published. Previous version archived.`,
        })
      }
    }

    // Regular approval (first version or no parent)
    await coursesDB.update(id, {
      status: 'published',
    })

    // Create status history
    await courseStatusHistoryDB.create({
      courseId: id,
      status: 'published',
      changedBy: user.id,
      changedByRole: user.role,
      reason: 'Course approved and published by admin',
    })

    // Notify instructor
    await createNotification(
      course.instructorId,
      'course',
      'Course Published',
      `Your course "${typeof course.title === 'object' ? course.title.en : course.title}" has been approved and published.`,
      `/instructor/courses/${id}`
    )

    return Response.json({
      success: true,
      message: 'Course approved and published successfully',
    })
  } catch (error) {
    console.error('Approve course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
