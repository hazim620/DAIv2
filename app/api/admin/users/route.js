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

    const allUsers = await usersDB.getAll()
    const users = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      accountStatus: u.accountStatus || 'active',
      createdAt: u.createdAt,
    }))

    return Response.json({ users })
  } catch (error) {
    console.error('Admin users list error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
