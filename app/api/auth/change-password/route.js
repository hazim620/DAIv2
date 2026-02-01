import { requireAuth } from '@/lib/auth'
import { usersDB } from '@/lib/db'
import { comparePassword, hashPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Get full user data from database
    const fullUser = await usersDB.getById(user.id)
    if (!fullUser) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    if (!comparePassword(currentPassword, fullUser.password)) {
      return Response.json(
        { error: 'كلمة المرور الحالية غير صحيحة', errorCode: 'invalid_current_password' },
        { status: 401 }
      )
    }

    // Validate new password requirements
    if (newPassword.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    if (!/[A-Z]/.test(newPassword)) {
      return Response.json(
        { error: 'Password must contain an uppercase letter' },
        { status: 400 }
      )
    }
    if (!/[a-z]/.test(newPassword)) {
      return Response.json(
        { error: 'Password must contain a lowercase letter' },
        { status: 400 }
      )
    }
    if (!/[0-9]/.test(newPassword)) {
      return Response.json(
        { error: 'Password must contain a number' },
        { status: 400 }
      )
    }

    // Update password
    const hashedPassword = hashPassword(newPassword)
    await usersDB.update(user.id, {
      password: hashedPassword,
    })

    // TODO: Invalidate all existing sessions (logout from all devices)
    // This would require a session management system

    return Response.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
