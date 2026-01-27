import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { coursesDB, courseSubmissionsDB, courseStatusHistoryDB } from '@/lib/db'

// Get all submissions for instructor
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const instructorId = user.id
    const submissions = courseSubmissionsDB.getByInstructorId(instructorId)
    
    // Enrich with course data
    const enrichedSubmissions = submissions.map(submission => {
      const course = coursesDB.getById(submission.courseId)
      return {
        ...submission,
        course: course ? {
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
        } : null,
      }
    })

    return NextResponse.json({ submissions: enrichedSubmissions })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Submit a course for review
export async function POST(request) {
  try {
    const user = await requireAuth(request)
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const course = coursesDB.getById(courseId)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - You can only submit your own courses' },
        { status: 403 }
      )
    }

    // Check if course can be submitted
    if (course.status !== 'draft' && course.status !== 'changes_requested') {
      return NextResponse.json(
        { error: `Course cannot be submitted. Current status: ${course.status}` },
        { status: 400 }
      )
    }

    // Create submission
    const submission = courseSubmissionsDB.create({
      courseId,
      instructorId: user.id,
      status: 'submitted_for_review',
    })

    // Update course status
    coursesDB.update(courseId, {
      status: 'submitted_for_review',
    })

    // Create status history entry
    courseStatusHistoryDB.create({
      courseId,
      status: 'submitted_for_review',
      changedBy: user.id,
      changedByRole: user.role,
      reason: 'Submitted for admin review',
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Submit course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
