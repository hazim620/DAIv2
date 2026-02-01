import { requireAdmin } from '@/lib/auth'
import { usersDB } from '@/lib/db'

export async function POST(request, { params }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = params
    const body = await request.json()
    const { reason } = body

    if (!reason || !reason.trim()) {
      return Response.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const instructor = await usersDB.getById(id)

    if (!instructor || instructor.role !== 'instructor') {
      return Response.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    // Update instructor status to rejected with reason
    await usersDB.update(id, {
      accountStatus: 'rejected',
      adminRejectionReason: reason,
    })

    // TODO: Send rejection email notification with reason
    console.log(`Instructor ${instructor.email} has been rejected. Reason: ${reason}`)

    return Response.json({
      success: true,
      message: 'Instructor rejected successfully',
    })
  } catch (error) {
    console.error('Reject instructor error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
