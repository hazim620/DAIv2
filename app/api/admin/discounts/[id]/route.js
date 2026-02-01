import { requireAdmin } from '@/lib/auth'
import { discountCodesDB } from '@/lib/db'

export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const id = params?.id
    if (!id) {
      return Response.json({ error: 'Discount code ID required' }, { status: 400 })
    }
    const code = await discountCodesDB.getById(id)
    if (!code) {
      return Response.json({ error: 'Discount code not found' }, { status: 404 })
    }
    await discountCodesDB.delete(id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Admin delete discount error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
