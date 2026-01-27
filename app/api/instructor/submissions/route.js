import { requireAuth } from '@/lib/auth'
import { coursesDB, courseSubmissionsDB, courseStatusHistoryDB } from '@/lib/db'
import { validateCourseContent } from '@/lib/content-policies'

// Get all submissions for instructor
export async function GET(request) {
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

    const instructorId = user.id
    const submissions = await courseSubmissionsDB.getByInstructorId(instructorId)
    
    // Enrich with course data
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      const course = await coursesDB.getById(submission.courseId)
      return {
        ...submission,
        course: course ? {
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
        } : null,
      }
    }))

    return Response.json({ submissions: enrichedSubmissions })
  } catch (error) {
    console.error('Get submissions error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Submit a course for review
export async function POST(request) {
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

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return Response.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const course = await coursesDB.getById(courseId)
    
    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this course
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - You can only submit your own courses' },
        { status: 403 }
      )
    }

    // Check if course can be submitted
    if (course.status !== 'draft' && course.status !== 'changes_requested') {
      return Response.json(
        { error: `Course cannot be submitted. Current status: ${course.status}` },
        { status: 400 }
      )
    }

    // Validate course content using content policies
    const validation = validateCourseContent(course)
    
    if (!validation.valid) {
      return Response.json(
        { 
          error: 'Course validation failed',
          validationErrors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // Create submission
    const submission = await courseSubmissionsDB.create({
      courseId,
      instructorId: user.id,
      status: 'submitted_for_review',
    })

    // Update course status
    await coursesDB.update(courseId, {
      status: 'submitted_for_review',
    })

    // Create status history entry
    await courseStatusHistoryDB.create({
      courseId,
      status: 'submitted_for_review',
      changedBy: user.id,
      changedByRole: user.role,
      reason: 'Submitted for admin review',
    })

    return Response.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Submit course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
