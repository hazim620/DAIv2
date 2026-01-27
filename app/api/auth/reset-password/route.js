import { usersDB } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return Response.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password requirements
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

    // Find user by reset token
    const allUsers = await usersDB.getAll()
    const user = allUsers.find(u => 
      u.passwordResetToken === token &&
      u.passwordResetExpires &&
      new Date(u.passwordResetExpires) > new Date()
    )

    if (!user) {
      return Response.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update password and clear reset token
    const hashedPassword = hashPassword(newPassword)
    await usersDB.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    })

    // TODO: Invalidate all existing sessions (logout from all devices)
    // This would require a session management system

    return Response.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
