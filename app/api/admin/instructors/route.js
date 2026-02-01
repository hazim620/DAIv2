import { requireAdmin } from '@/lib/auth'
import { usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
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
