import { cookies } from 'next/headers'
import { usersDB } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await usersDB.getByEmail(email)
    if (!user) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    if (!comparePassword(password, user.password)) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check account status for instructors
    if (user.role === 'instructor') {
      if (user.accountStatus === 'email_not_verified') {
        return Response.json(
          { error: 'Please verify your email address before logging in' },
          { status: 403 }
        )
      }
      if (user.accountStatus === 'pending_admin_approval') {
        return Response.json(
          { error: 'Please wait for approval. Your account is under review.' },
          { status: 403 }
        )
      }
      if (user.accountStatus === 'rejected') {
        return Response.json(
          { error: `Your account has been rejected. Reason: ${user.adminRejectionReason || 'No reason provided'}. Please contact support or resubmit your application.` },
          { status: 403 }
        )
      }
      if (user.accountStatus !== 'approved') {
        return Response.json(
          {
            error: 'Your registration is under review. We will update you once it is approved.',
            errorCode: 'account_not_approved',
          },
          { status: 403 }
        )
      }
    }

    // Generate token
    const token = generateToken(user)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Return response with user data
    return Response.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    console.error('Login error stack:', error.stack)
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
