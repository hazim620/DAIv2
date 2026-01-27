import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await usersDB.getById(decoded.id)
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return Response.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Get user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
