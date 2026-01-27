import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { announcementsDB, coursesDB } from '@/lib/db'

// Get all announcements for instructor
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
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    let announcements = announcementsDB.getByInstructorId(instructorId)
    
    if (courseId) {
      announcements = announcements.filter(a => a.courseId === courseId)
    }

    // Sort by date (newest first)
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new announcement
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
    const { courseId, title, content, scheduledFor } = body

    if (!courseId || !title || !content) {
      return NextResponse.json(
        { error: 'Course ID, title, and content are required' },
        { status: 400 }
      )
    }

    // Verify instructor owns this course
    const course = coursesDB.getById(courseId)
    if (!course || (course.instructorId !== user.id && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Course not found or unauthorized' },
        { status: 404 }
      )
    }

    const announcement = announcementsDB.create({
      courseId,
      instructorId: user.id,
      title,
      content,
      scheduledFor: scheduledFor || null,
      isPublished: !scheduledFor, // If scheduled, not published yet
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
