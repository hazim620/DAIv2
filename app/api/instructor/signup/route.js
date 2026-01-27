import { cookies } from 'next/headers'
import { usersDB } from '@/lib/db'
import { hashPassword, generateEmailVerificationToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      mobileNumber,
      password,
      nationality,
      countryOfResidence,
      educationLevel,
      dateOfBirth,
      gender,
      universityName,
      major,
      readinessLevel,
      expectedStudentsPerTerm,
      howDidYouHear,
      agreedToTerms,
    } = body

    // Validation
    if (!firstName || !lastName || !email || !mobileNumber || !password) {
      return Response.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    if (!agreedToTerms) {
      return Response.json(
        { error: 'You must agree to the terms and conditions' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await usersDB.getByEmail(email)
    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user with instructor role and pending status
    const hashedPassword = hashPassword(password)
    const fullName = `${firstName} ${lastName}`
    
    const user = await usersDB.create({
      email,
      password: hashedPassword,
      name: fullName,
      role: 'instructor',
      // Step 1 fields
      firstName,
      lastName,
      mobileNumber,
      // Step 2 fields
      nationality,
      countryOfResidence,
      educationLevel,
      dateOfBirth,
      gender,
      // Step 3 fields
      universityName,
      major,
      readinessLevel,
      expectedStudentsPerTerm,
      howDidYouHear,
      // Email verification
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      accountStatus: 'email_not_verified',
    })

    // TODO: Send verification email
    // For now, we'll just log it
    console.log(`Email verification token for ${email}: ${verificationToken}`)
    console.log(`Verification link: /instructor/verify-email?token=${verificationToken}`)

    // Don't set cookie or login - user must verify email first
    return Response.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      email: email, // Return email for verification page
    }, { status: 201 })
  } catch (error) {
    console.error('Instructor signup error:', error)
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
