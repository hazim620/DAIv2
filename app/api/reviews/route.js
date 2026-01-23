import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { reviewsDB, usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // If courseId is 'all', get all reviews (for admin)
    const reviews = courseId === 'all' 
      ? reviewsDB.getAll()
      : reviewsDB.getByCourseId(courseId)
    const users = usersDB.getAll()

    // Enrich reviews with user data
    const enrichedReviews = reviews.map(review => {
      const user = users.find(u => u.id === review.userId)
      return {
        ...review,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : null,
      }
    })

    return NextResponse.json({ reviews: enrichedReviews })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { courseId, rating, comment } = body

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Course ID and valid rating (1-5) are required' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this course
    const existing = reviewsDB.getByUserAndCourse(authResult.user.id, courseId)
    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this course' },
        { status: 400 }
      )
    }

    const review = reviewsDB.create({
      userId: authResult.user.id,
      courseId: courseId.toString(),
      rating: parseInt(rating),
      comment: comment || '',
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
