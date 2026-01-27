import { usersDB } from '@/lib/db'

export async function POST(request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return Response.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user by verification token
    const allUsers = await usersDB.getAll()
    const user = allUsers.find(u => 
      u.emailVerificationToken === token &&
      u.emailVerificationExpires &&
      new Date(u.emailVerificationExpires) > new Date()
    )

    if (!user) {
      return Response.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user: mark email as verified and change status to pending_admin_approval
    await usersDB.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      accountStatus: 'pending_admin_approval',
    })

    return Response.json({
      success: true,
      message: 'Email verified successfully. Your account is now pending admin approval.',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
