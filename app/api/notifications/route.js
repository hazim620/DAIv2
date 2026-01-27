import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/postgres'

// Get user notifications
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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let queryText = 'SELECT * FROM notifications WHERE user_id = $1'
    const params = [user.id]
    let paramIndex = 2

    if (type) {
      queryText += ` AND type = $${paramIndex++}`
      params.push(type)
    }

    if (unreadOnly) {
      queryText += ` AND read = false`
    }

    queryText += ' ORDER BY created_at DESC LIMIT 50'

    const result = await query(queryText, params)

    const notifications = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link,
      read: row.read,
      createdAt: row.created_at?.toISOString(),
    }))

    return Response.json({ notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PUT(request) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    const body = await request.json()
    const { notificationId, read } = body

    if (!notificationId) {
      return Response.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    await query(
      'UPDATE notifications SET read = $1 WHERE id = $2 AND user_id = $3',
      [read !== undefined ? read : true, notificationId, user.id]
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error('Update notification error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
