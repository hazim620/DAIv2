import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { coursesDB, courseStatusHistoryDB } from '@/lib/db'

// Get all instructor courses
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
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    
    let courses = coursesDB.getByInstructorId(instructorId)
    
    // Apply filters
    if (status) {
      courses = courses.filter(c => c.status === status)
    }
    if (category) {
      courses = courses.filter(c => c.category === category)
    }
    
    // Sort by updated date (newest first)
    courses.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Get instructor courses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new course
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
    const {
      title,
      description,
      shortDescription,
      category,
      level,
      language,
      price,
      thumbnail,
      sections = [],
    } = body

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const newCourse = coursesDB.create({
      instructorId: user.id,
      instructor: user.name || user.email,
      title: typeof title === 'string' ? { en: title, ar: title } : title,
      description: typeof description === 'string' ? { en: description, ar: description } : description,
      shortDescription: shortDescription || description,
      category: category || 'general',
      level: level || 'beginner',
      language: language || 'en',
      price: price || 0,
      thumbnail: thumbnail || '/api/placeholder/400/250',
      sections: sections || [],
      status: 'draft',
      students: 0,
      duration: '0 hours',
    })

    // Create status history entry
    courseStatusHistoryDB.create({
      courseId: newCourse.id,
      status: 'draft',
      changedBy: user.id,
      changedByRole: user.role,
      reason: 'Course created',
    })

    return NextResponse.json({ course: newCourse }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
