import { requireAuth } from '@/lib/auth'
import { coursesDB, courseStatusHistoryDB } from '@/lib/db'

// Get a specific course (instructor's own course)
export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json(
        { error: 'Unauthorized - Instructor access required' },
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

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - You can only access your own courses' },
        { status: 403 }
      )
    }

    // Get status history
    const statusHistory = await courseStatusHistoryDB.getByCourseId(id)

    return Response.json({ 
      course,
      statusHistory,
    })
  } catch (error) {
    console.error('Get instructor course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a course
export async function PUT(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json(
        { error: 'Unauthorized - Instructor access required' },
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

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - You can only edit your own courses' },
        { status: 403 }
      )
    }

    // Check if course can be edited
    if (course.status === 'submitted_for_review' && user.role !== 'admin') {
      return Response.json(
        { error: 'Course cannot be edited while under review. Wait for admin feedback.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updates = { ...body }
    
    // Don't allow status changes through this endpoint (use submission endpoint)
    delete updates.status
    
    const updatedCourse = await coursesDB.update(id, updates)

    return Response.json({ course: updatedCourse })
  } catch (error) {
    console.error('Update course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a course
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json(
        { error: 'Unauthorized - Instructor access required' },
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

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - You can only delete your own courses' },
        { status: 403 }
      )
    }

    // Only allow deletion of draft courses
    if (course.status !== 'draft' && user.role !== 'admin') {
      return Response.json(
        { error: 'Only draft courses can be deleted. Archive instead.' },
        { status: 400 }
      )
    }

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
