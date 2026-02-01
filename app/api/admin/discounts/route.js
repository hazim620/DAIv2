import { requireAdmin } from '@/lib/auth'
import { discountCodesDB, usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const codes = await discountCodesDB.getAll()
    const instructorIds = [...new Set(codes.map((c) => c.instructorId))]
    const instructors = await Promise.all(instructorIds.map((id) => usersDB.getById(id)))
    const instructorMap = Object.fromEntries(
      instructors.filter(Boolean).map((u) => [u.id, u.name || u.email])
    )
    const list = codes.map((c) => ({
      ...c,
      instructorName: instructorMap[c.instructorId] || c.instructorId,
    }))
    return Response.json({ codes: list })
  } catch (error) {
    console.error('Admin discounts list error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }
    const body = await request.json()
    const { instructorId, code, discountPercent, startDate, endDate, maxUses } = body
    if (!instructorId || !code?.trim()) {
      return Response.json({ error: 'Instructor and code are required' }, { status: 400 })
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
      return Response.json({ error: 'Max uses must be empty or positive' }, { status: 400 })
    }
    const created = await discountCodesDB.create({
      instructorId,
      code: code.trim(),
      discountPercent: percent,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      maxUses: max,
    })
    return Response.json({ code: created }, { status: 201 })
  } catch (error) {
    console.error('Admin create discount error:', error)
    if (error.code === '23505') {
      return Response.json({ error: 'This code already exists for this instructor' }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
