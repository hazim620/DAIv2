import { requireAuth } from '@/lib/auth'
import { discountCodesDB } from '@/lib/db'

export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const user = authResult.user
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const id = params?.id
    if (!id) {
      return Response.json({ error: 'Discount code ID required' }, { status: 400 })
    }
    const code = await discountCodesDB.getById(id)
    if (!code) {
      return Response.json({ error: 'Discount code not found' }, { status: 404 })
    }
    // Instructors can only delete their own; admins can delete any (handled by instructor API - admins use admin API)
    if (user.role === 'instructor' && code.instructorId !== user.id) {
      return Response.json({ error: 'You can only delete your own discount codes' }, { status: 403 })
    }
    await discountCodesDB.delete(id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Instructor delete discount error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
