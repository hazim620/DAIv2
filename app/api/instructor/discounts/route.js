import { requireAuth } from '@/lib/auth'
import { discountCodesDB } from '@/lib/db'

export async function GET(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const user = authResult.user
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const codes = await discountCodesDB.getByInstructorId(user.id)
    return Response.json({ codes })
  } catch (error) {
    console.error('Get discount codes error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const user = authResult.user
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const body = await request.json()
    const { code, discountPercent, startDate, endDate, maxUses } = body
    if (!code || !code.trim()) {
      return Response.json({ error: 'Code is required' }, { status: 400 })
    }
    const percent = parseInt(discountPercent, 10)
    if (Number.isNaN(percent) || percent < 1 || percent > 25) {
      return Response.json({ error: 'Discount must be between 1 and 25%' }, { status: 400 })
    }
    if (!startDate || !endDate) {
      return Response.json({ error: 'Start date and end date are required' }, { status: 400 })
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return Response.json({ error: 'Invalid dates' }, { status: 400 })
    }
    if (end <= start) {
      return Response.json({ error: 'End date must be after start date' }, { status: 400 })
    }
    const max = maxUses === '' || maxUses == null ? null : parseInt(maxUses, 10)
    if (max !== null && (Number.isNaN(max) || max < 1)) {
      return Response.json({ error: 'Max uses must be empty (unlimited) or a positive number' }, { status: 400 })
    }
    const created = await discountCodesDB.create({
      instructorId: user.id,
      code: code.trim(),
      discountPercent: percent,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      maxUses: max,
    })
    return Response.json({ code: created }, { status: 201 })
  } catch (error) {
    console.error('Create discount code error:', error)
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return Response.json({ error: 'This code already exists' }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
