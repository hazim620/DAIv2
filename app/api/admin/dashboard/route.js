import { requireAdmin } from '@/lib/auth'
import { query } from '@/lib/postgres'

// Configurable percentages (env or defaults): instructor share, tax, payment gateway fee
const INSTRUCTOR_SHARE_PERCENT = Number(process.env.ADMIN_INSTRUCTOR_SHARE_PERCENT) || 70
const TAX_PERCENT = Number(process.env.ADMIN_TAX_PERCENT) || 0
const GATEWAY_FEE_PERCENT = Number(process.env.ADMIN_GATEWAY_FEE_PERCENT) || 2

export async function GET(request) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') // ISO date
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category') || ''

    // Build optional filters for enrollments/courses
    let enrollmentFilter = ''
    const params = []
    let paramIndex = 1

    if (dateFrom) {
      enrollmentFilter += ` AND e.enrolled_at >= $${paramIndex++}`
      params.push(dateFrom)
    }
    if (dateTo) {
      enrollmentFilter += ` AND e.enrolled_at <= $${paramIndex++}`
      params.push(dateTo + 'T23:59:59.999Z')
    }
    if (category) {
      enrollmentFilter += ` AND c.category = $${paramIndex++}`
      params.push(category)
    }

    // Gross revenue: sum of (course price) for each enrollment in range
    const revenueResult = await query(
      `SELECT COALESCE(SUM(c.price::numeric), 0) AS gross
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE 1=1 ${enrollmentFilter}`,
      params
    )
    const grossRevenue = parseFloat(revenueResult.rows[0]?.gross || 0)

    const instructorShare = grossRevenue * (INSTRUCTOR_SHARE_PERCENT / 100)
    const tax = grossRevenue * (TAX_PERCENT / 100)
    const gatewayFee = grossRevenue * (GATEWAY_FEE_PERCENT / 100)
    const netRevenue = grossRevenue - instructorShare - tax - gatewayFee

    // Total courses (optionally filtered by category)
    let courseFilter = ''
    const courseParams = []
    if (category) {
      courseFilter = ' WHERE category = $1'
      courseParams.push(category)
    }
    const coursesResult = await query(
      `SELECT COUNT(*) AS total FROM courses ${courseFilter}`,
      courseParams
    )
    const totalCourses = parseInt(coursesResult.rows[0]?.total || 0, 10)

    // Active instructors (approved)
    const instructorsResult = await query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'instructor' AND account_status = 'approved'`
    )
    const totalInstructors = parseInt(instructorsResult.rows[0]?.total || 0, 10)

    // Total students (distinct users who have at least one enrollment in range)
    const studentsResult = await query(
      `SELECT COUNT(DISTINCT e.user_id) AS total FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE 1=1 ${enrollmentFilter}`,
      params
    )
    const totalStudents = parseInt(studentsResult.rows[0]?.total || 0, 10)

    return Response.json({
      totalGrossRevenue: Math.round(grossRevenue * 100) / 100,
      totalNetRevenue: Math.round(netRevenue * 100) / 100,
      instructorShare: Math.round(instructorShare * 100) / 100,
      tax,
      gatewayFee: Math.round(gatewayFee * 100) / 100,
      totalCourses,
      totalInstructors,
      totalStudents,
      filters: { dateFrom: dateFrom || null, dateTo: dateTo || null, category: category || null },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
