import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { usersDB } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = usersDB.getByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create user
    const hashedPassword = hashPassword(password)
    const user = usersDB.create({
      email,
      password: hashedPassword,
      name: fullName,
      role: 'student',
    })

    // Generate token
    const token = generateToken(user)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
    })

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
