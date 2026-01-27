import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { coursesDB, courseStatusHistoryDB } from '@/lib/db'

// Get a specific course (instructor's own course)
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request)
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const course = coursesDB.getById(id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - You can only access your own courses' },
        { status: 403 }
      )
    }

    // Get status history
    const statusHistory = courseStatusHistoryDB.getByCourseId(id)

    return NextResponse.json({ 
      course,
      statusHistory,
    })
  } catch (error) {
    console.error('Get instructor course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a course
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request)
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const course = coursesDB.getById(id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own courses' },
        { status: 403 }
      )
    }

    // Check if course can be edited
    if (course.status === 'submitted_for_review' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Course cannot be edited while under review. Wait for admin feedback.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updates = { ...body }
    
    // Don't allow status changes through this endpoint (use submission endpoint)
    delete updates.status
    
    const updatedCourse = coursesDB.update(id, updates)

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a course
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request)
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const course = coursesDB.getById(id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own courses' },
        { status: 403 }
      )
    }

    // Only allow deletion of draft courses
    if (course.status !== 'draft' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only draft courses can be deleted. Archive instead.' },
        { status: 400 }
      )
    }

    coursesDB.delete(id)

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
