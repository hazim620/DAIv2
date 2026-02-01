import { requireAdmin } from '@/lib/auth'
import { usersDB } from '@/lib/db'

const ALLOWED_ROLES = ['student', 'instructor', 'admin']

export async function GET(request, { params }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = params
    const user = await usersDB.getById(id)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const { password: _, ...rest } = user
    return Response.json({ user: rest })
  } catch (error) {
    console.error('Admin get user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))
    const { role } = body

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return Response.json(
          { error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const user = await usersDB.getById(id)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const updates = {}
    if (role !== undefined) updates.role = role

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await usersDB.update(id, updates)
    const updated = await usersDB.getById(id)
    const { password: _, ...rest } = updated
    return Response.json({ user: rest })
  } catch (error) {
    console.error('Admin update user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
