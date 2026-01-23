// Authentication utilities
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-please-use-env-variable'

// Simple JWT-like token implementation
export function generateToken(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'student',
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    if (signature !== expectedSignature) return null

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

export function hashPassword(password) {
  // Simple hash function - in production, use bcrypt
  // This is a placeholder - replace with proper bcrypt implementation
  return Buffer.from(password).toString('base64')
}

export function comparePassword(password, hashedPassword) {
  // Simple comparison - in production, use bcrypt
  return hashPassword(password) === hashedPassword
}

// Middleware to verify authentication (for use in API routes)
export async function requireAuth(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return { error: 'Unauthorized', status: 401 }
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return { error: 'Invalid token', status: 401 }
    }

    return { user: decoded }
  } catch (error) {
    return { error: 'Unauthorized', status: 401 }
  }
}
