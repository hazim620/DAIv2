import { requireAuth } from '@/lib/auth'
import { coursesDB, courseStatusHistoryDB } from '@/lib/db'

// Get all instructor courses
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
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    
    let courses = await coursesDB.getByInstructorId(instructorId)
    
    // Apply filters
    if (status) {
      courses = courses.filter(c => c.status === status)
    }
    if (category) {
      courses = courses.filter(c => c.category === category)
    }
    
    // Sort by updated date (newest first)
    courses.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    return Response.json({ courses })
  } catch (error) {
    console.error('Get instructor courses error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new course
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
      return Response.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const newCourse = await coursesDB.create({
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
    await courseStatusHistoryDB.create({
      courseId: newCourse.id,
      status: 'draft',
      changedBy: user.id,
      changedByRole: user.role,
      reason: 'Course created',
    })

    return Response.json({ course: newCourse }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
