import { requireAdmin } from '@/lib/auth'
import { query } from '@/lib/postgres'

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
    const sortBy = searchParams.get('sortBy') || 'revenue' // revenue | enrollments | status
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const params = []
    let paramIndex = 1
    let whereClause = ' WHERE 1=1'
    if (category) {
      whereClause += ` AND c.category = $${paramIndex++}`
      params.push(category)
    }
    if (status) {
      whereClause += ` AND c.status = $${paramIndex++}`
      params.push(status)
    }

    const orderBy = {
      revenue: 'gross_revenue DESC',
      enrollments: 'enrolled_count DESC',
      status: 'c.status ASC',
    }[sortBy] || 'gross_revenue DESC'

    const result = await query(
      `SELECT c.id, c.title, c.instructor, c.instructor_id, c.status, c.category, c.price,
              COUNT(e.id) AS enrolled_count,
              COALESCE(SUM(c.price::numeric), 0) AS gross_revenue
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       ${whereClause}
       GROUP BY c.id, c.title, c.instructor, c.instructor_id, c.status, c.category, c.price
       ORDER BY ${orderBy}`,
      params
    )

    const courses = result.rows.map((row) => {
      const gross = parseFloat(row.gross_revenue || 0)
      const instructorShare = gross * (INSTRUCTOR_SHARE_PERCENT / 100)
      const tax = gross * (TAX_PERCENT / 100)
      const gatewayFee = gross * (GATEWAY_FEE_PERCENT / 100)
      const netPlatform = gross - instructorShare - tax - gatewayFee
      const title = typeof row.title === 'object' ? row.title?.en || row.title?.ar : row.title
      return {
        id: row.id,
        title,
        instructorName: row.instructor,
        instructorId: row.instructor_id,
        status: row.status || 'draft',
        category: row.category,
        price: parseFloat(row.price) || 0,
        enrolledCount: parseInt(row.enrolled_count || 0, 10),
        grossRevenue: Math.round(gross * 100) / 100,
        instructorShare: Math.round(instructorShare * 100) / 100,
        netPlatformRevenue: Math.round(netPlatform * 100) / 100,
      }
    })

    return Response.json({ courses })
  } catch (error) {
    console.error('Admin courses performance error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
