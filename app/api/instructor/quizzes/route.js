import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { quizzesDB, coursesDB } from '@/lib/db'

// Get all quizzes for instructor's courses
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
    const lessonId = searchParams.get('lessonId')
    
    // Get instructor's courses
    const instructorCourses = coursesDB.getByInstructorId(instructorId)
    const courseIds = instructorCourses.map(c => c.id)
    
    let quizzes = quizzesDB.getAll().filter(q => courseIds.includes(q.courseId))
    
    if (courseId) {
      quizzes = quizzes.filter(q => q.courseId === courseId)
    }
    
    if (lessonId) {
      quizzes = quizzes.filter(q => q.lessonId === lessonId)
    }

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new quiz
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
    const { courseId, lessonId, title, description, passingScore, timeLimit, questions } = body

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Course ID and title are required' },
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

    const quiz = quizzesDB.create({
      courseId,
      lessonId: lessonId || null,
      title,
      description: description || '',
      passingScore: passingScore || 70,
      timeLimit: timeLimit || null,
      questions: questions || [],
    })

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
