import { requireAdmin } from '@/lib/auth'
import { usersDB } from '@/lib/db'

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
    const instructor = await usersDB.getById(id)
    if (!instructor || instructor.role !== 'instructor') {
      return Response.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }
    const { password: _, ...rest } = instructor
    return Response.json({ instructor: rest })
  } catch (error) {
    console.error('Admin get instructor error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
