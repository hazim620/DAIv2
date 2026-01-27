import { requireAuth } from '@/lib/auth'
import { reviewsDB, usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return Response.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // If courseId is 'all', get all reviews (for admin)
    const reviews = courseId === 'all' 
      ? await reviewsDB.getAll()
      : await reviewsDB.getByCourseId(courseId)
    const users = await usersDB.getAll()

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

    return Response.json({ reviews: enrichedReviews })
  } catch (error) {
    console.error('Get reviews error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { courseId, rating, comment } = body

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Course ID and valid rating (1-5) are required' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this course
    const existing = await reviewsDB.getByUserAndCourse(authResult.user.id, courseId)
    if (existing) {
      return Response.json(
        { error: 'You have already reviewed this course' },
        { status: 400 }
      )
    }

    const review = await reviewsDB.create({
      userId: authResult.user.id,
      courseId: courseId.toString(),
      rating: parseInt(rating),
      comment: comment || '',
    })

    return Response.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
