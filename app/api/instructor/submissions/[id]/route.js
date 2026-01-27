import { requireAuth } from '@/lib/auth'
import { courseSubmissionsDB, coursesDB } from '@/lib/db'

// Get a specific submission with admin feedback
export async function GET(request, { params }) {
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

    const { id } = params
    const submissions = await courseSubmissionsDB.getAll()
    const submission = submissions.find(s => s.id === id || s.courseId === id)
    
    if (!submission) {
      return Response.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this submission
    if (submission.instructorId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - You can only view your own submissions' },
        { status: 403 }
      )
    }

    // Get course data
    const course = await coursesDB.getById(submission.courseId)

    return Response.json({ 
      submission,
      course,
    })
  } catch (error) {
    console.error('Get submission error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reply to admin comment
export async function POST(request, { params }) {
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

    const { id } = params
    const body = await request.json()
    const { commentId, reply } = body

    if (!commentId || !reply) {
      return Response.json(
        { error: 'Comment ID and reply are required' },
        { status: 400 }
      )
    }

    const submissions = await courseSubmissionsDB.getAll()
    const submission = submissions.find(s => s.id === id || s.courseId === id)
    
    if (!submission) {
      return Response.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Verify instructor owns this submission
    if (submission.instructorId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Find and update the comment
    const adminComments = submission.adminComments || []
    const commentIndex = adminComments.findIndex(c => c.id === commentId)
    
    if (commentIndex === -1) {
      return Response.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Add reply to comment
    adminComments[commentIndex].replies = adminComments[commentIndex].replies || []
    adminComments[commentIndex].replies.push({
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name || user.email,
      reply,
      createdAt: new Date().toISOString(),
    })

    await courseSubmissionsDB.update(submission.id, {
      adminComments,
    })

    return Response.json({ message: 'Reply added successfully' })
  } catch (error) {
    console.error('Reply to comment error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
