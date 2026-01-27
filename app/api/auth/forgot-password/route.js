import { usersDB } from '@/lib/db'
import { generatePasswordResetToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await usersDB.getByEmail(email)

    if (!user) {
      // Don't reveal if user exists for security
      return Response.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await usersDB.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    })

    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${resetToken}`)
    console.log(`Reset link: /reset-password?token=${resetToken}`)

    return Response.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
