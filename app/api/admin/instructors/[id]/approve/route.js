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
    const instructor = await usersDB.getById(id)

    if (!instructor || instructor.role !== 'instructor') {
      return Response.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    // Update instructor status to approved
    await usersDB.update(id, {
      accountStatus: 'approved',
      emailVerified: true, // Also mark email as verified
    })

    // TODO: Send approval email notification
    console.log(`Instructor ${instructor.email} has been approved`)

    return Response.json({
      success: true,
      message: 'Instructor approved successfully',
    })
  } catch (error) {
    console.error('Approve instructor error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
