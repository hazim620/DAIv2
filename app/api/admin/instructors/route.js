import { requireAuth } from '@/lib/auth'
import { usersDB } from '@/lib/db'

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
    
    if (user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get all instructors
    const allUsers = await usersDB.getAll()
    const instructors = allUsers.filter(u => u.role === 'instructor')

    return Response.json({ instructors })
  } catch (error) {
    console.error('Get instructors error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
