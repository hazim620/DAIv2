import { requireAuth } from '@/lib/auth'
import { progressDB, enrollmentsDB, coursesDB } from '@/lib/db'

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { enrollmentId, videoId, watched, duration } = body

    if (!enrollmentId || !videoId) {
      return Response.json(
        { error: 'Enrollment ID and Video ID are required' },
        { status: 400 }
      )
    }

    // Verify enrollment belongs to user
    const allEnrollments = await enrollmentsDB.getAll()
    const enrollment = allEnrollments.find(e => e.id === enrollmentId)
    if (!enrollment || enrollment.userId !== authResult.user.id) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update progress
    const progress = await progressDB.updateVideoProgress(
      enrollmentId,
      videoId,
      watched || false,
      duration || 0
    )

    // Update enrollment progress: get course to count total videos
    const allProgress = await progressDB.getByEnrollment(enrollmentId)
    const course = await coursesDB.getById(enrollment.courseId)
    const totalVideos = (course?.sections || []).reduce(
      (sum, section) => sum + (section.videos || []).length,
      0
    )
    const watchedCount = allProgress.filter(p => p.watched).length
    const progressPercentage = totalVideos > 0
      ? Math.round((watchedCount / totalVideos) * 100)
      : 0
    const completedVideoIds = allProgress
      .filter(p => p.watched)
      .map(p => (p.videoId != null ? String(p.videoId) : p.videoId))

    await enrollmentsDB.update(enrollmentId, {
      progress: progressPercentage,
      completedVideos: completedVideoIds,
    })

    return Response.json({ progress, progressPercentage })
  } catch (error) {
    console.error('Update progress error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')

    if (!enrollmentId) {
      return Response.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      )
    }

    // Verify enrollment belongs to user
    const allEnrollments = await enrollmentsDB.getAll()
    const enrollment = allEnrollments.find(e => e.id === enrollmentId)
    if (!enrollment || enrollment.userId !== authResult.user.id) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const progress = await progressDB.getByEnrollment(enrollmentId)
    return Response.json({ progress })
  } catch (error) {
    console.error('Get progress error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
