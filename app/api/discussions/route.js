import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { discussionsDB, usersDB } from '@/lib/db'

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

    const discussions = discussionsDB.getByCourseId(courseId)
    const users = usersDB.getAll()

    // Enrich discussions with user data
    const enrichedDiscussions = discussions.map(discussion => {
      const user = users.find(u => u.id === discussion.userId)
      const enrichedReplies = (discussion.replies || []).map(reply => {
        const replyUser = users.find(u => u.id === reply.userId)
        return {
          ...reply,
          user: replyUser ? {
            id: replyUser.id,
            name: replyUser.name,
            email: replyUser.email,
          } : null,
        }
      })

      return {
        ...discussion,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : null,
        replies: enrichedReplies,
        likesCount: (discussion.likes || []).length,
      }
    })

    // Sort by most recent first
    enrichedDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({ discussions: enrichedDiscussions })
  } catch (error) {
    console.error('Get discussions error:', error)
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
    const { courseId, title, content, discussionId, reply, action } = body

    // Handle like/unlike action
    if (action === 'like' && discussionId) {
      const discussion = discussionsDB.toggleLike(discussionId, authResult.user.id)
      return NextResponse.json({ discussion })
    }

    // Handle reply
    if (discussionId && reply) {
      const newReply = discussionsDB.addReply(discussionId, {
        userId: authResult.user.id,
        content: reply,
      })
      return NextResponse.json({ reply: newReply }, { status: 201 })
    }

    // Create new discussion
    if (!courseId || !title || !content) {
      return NextResponse.json(
        { error: 'Course ID, title, and content are required' },
        { status: 400 }
      )
    }

    const discussion = discussionsDB.create({
      userId: authResult.user.id,
      courseId: courseId.toString(),
      title,
      content,
    })

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Create discussion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
