import { cookies } from 'next/headers'
import { usersDB } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    // Validation
    if (!email || !password || !fullName) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await usersDB.getByEmail(email)
    if (existingUser) {
      return Response.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create user
    const hashedPassword = hashPassword(password)
    const user = await usersDB.create({
      email,
      password: hashedPassword,
      name: fullName,
      role: 'student',
    })

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
    }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', {
      message: error?.message,
      code: error?.code,
      dbHost: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      dbUser: process.env.DB_USER,
      dbPort: process.env.DB_PORT,
      dbSsl: process.env.DB_SSL,
      stack: error?.stack,
    })
    return Response.json(
      {
        error: 'Internal server error',
        // Temporary: helps debug Amplify/RDS issues. Remove for production.
        details: error?.message || null,
        code: error?.code || null,
      },
      { status: 500 }
    )
  }
}
