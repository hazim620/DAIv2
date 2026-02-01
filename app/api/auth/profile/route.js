import { requireAuth } from '@/lib/auth'
import { usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const user = await usersDB.getById(authResult.user.id)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    const { password: _, ...rest } = user
    return Response.json({ user: rest })
  } catch (error) {
    console.error('Get profile error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const body = await request.json()
    const { bankInfo } = body
    const updates = {}
    if (bankInfo !== undefined) updates.bankInfo = String(bankInfo ?? '')
    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    await usersDB.update(authResult.user.id, updates)
    const user = await usersDB.getById(authResult.user.id)
    const { password: _, ...rest } = user
    return Response.json({ user: rest })
  } catch (error) {
    console.error('Update profile error:', error)
    // Missing column = migration not run
    if (error?.code === '42703') {
      return Response.json(
        { error: 'Bank info not available. Run migration: ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_info TEXT;' },
        { status: 503 }
      )
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
