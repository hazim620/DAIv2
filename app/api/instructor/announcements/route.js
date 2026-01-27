import { requireAuth } from '@/lib/auth'
import { announcementsDB, coursesDB } from '@/lib/db'

// Get all announcements for instructor
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
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    let announcements = await announcementsDB.getByInstructorId(instructorId)
    
    if (courseId) {
      announcements = announcements.filter(a => a.courseId === courseId)
    }

    // Sort by date (newest first)
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return Response.json({ announcements })
  } catch (error) {
    console.error('Get announcements error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new announcement
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
    const { courseId, title, content, scheduledFor } = body

    if (!courseId || !title || !content) {
      return Response.json(
        { error: 'Course ID, title, and content are required' },
        { status: 400 }
      )
    }

    // Verify instructor owns this course
    const course = await coursesDB.getById(courseId)
    if (!course || (course.instructorId !== user.id && user.role !== 'admin')) {
      return Response.json(
        { error: 'Course not found or unauthorized' },
        { status: 404 }
      )
    }

    const announcement = await announcementsDB.create({
      courseId,
      instructorId: user.id,
      title,
      content,
      scheduledFor: scheduledFor || null,
      isPublished: !scheduledFor, // If scheduled, not published yet
    })

    return Response.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Create announcement error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
