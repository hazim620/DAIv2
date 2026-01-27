import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/postgres'

export async function POST(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { draftData } = body

    // Save or update draft
    const draftId = `draft-${id}`
    await query(
      `INSERT INTO course_drafts (id, course_id, instructor_id, draft_data, last_saved_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (course_id) 
       DO UPDATE SET draft_data = $4, last_saved_at = CURRENT_TIMESTAMP`,
      [draftId, id, user.id, JSON.stringify(draftData)]
    )

    return Response.json({ success: true, message: 'Draft saved' })
  } catch (error) {
    console.error('Save draft error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const { id } = params

    // Get draft
    const result = await query(
      'SELECT * FROM course_drafts WHERE course_id = $1 AND instructor_id = $2',
      [id, user.id]
    )

    if (result.rows.length === 0) {
      return Response.json({ draft: null })
    }

    const draft = result.rows[0]
    return Response.json({
      draft: {
        id: draft.id,
        courseId: draft.course_id,
        draftData: draft.draft_data,
        lastSavedAt: draft.last_saved_at?.toISOString(),
      },
    })
  } catch (error) {
    console.error('Get draft error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
