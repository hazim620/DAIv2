import { usersDB } from '@/lib/db'
import { generateEmailVerificationToken } from '@/lib/auth'

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
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return Response.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await usersDB.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    })

    // TODO: Send verification email
    console.log(`Resent verification token for ${email}: ${verificationToken}`)
    console.log(`Verification link: /instructor/signup/verify-email?token=${verificationToken}&email=${email}`)

    return Response.json({
      success: true,
      message: 'Verification link has been resent to your email',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
