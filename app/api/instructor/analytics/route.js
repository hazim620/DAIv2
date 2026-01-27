import { requireAuth } from '@/lib/auth'
import { coursesDB, enrollmentsDB, progressDB } from '@/lib/db'

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const instructorId = user.id
    const allCourses = await coursesDB.getByInstructorId(instructorId)
    
    let coursesToAnalyze = allCourses
    if (courseId) {
      coursesToAnalyze = allCourses.filter(c => c.id === courseId)
    }

    // Calculate analytics
    const analytics = {
      totalEnrollments: 0,
      totalRevenue: 0,
      completionRates: [],
      enrollmentsByDate: [],
      revenueByDate: [],
      courseBreakdown: [],
    }

    for (const course of coursesToAnalyze) {
      const enrollments = await enrollmentsDB.getByCourseId(course.id)
      
      // Filter by date range if provided
      let filteredEnrollments = enrollments
      if (startDate && endDate) {
        filteredEnrollments = enrollments.filter(e => {
          const enrolledDate = new Date(e.enrolledAt)
          return enrolledDate >= new Date(startDate) && enrolledDate <= new Date(endDate)
        })
      }

      analytics.totalEnrollments += filteredEnrollments.length
      analytics.totalRevenue += filteredEnrollments.length * (course.price || 0)

      // Calculate completion rate
      let completedCount = 0
      for (const enrollment of filteredEnrollments) {
        const progressData = await progressDB.getByEnrollment(enrollment.id)
        const totalVideos = course.sections?.reduce((sum, section) => 
          sum + (section.videos?.length || 0), 0) || 0
        const watchedVideos = progressData.filter(p => p.watched).length
        if (totalVideos > 0 && watchedVideos === totalVideos) {
          completedCount++
        }
      }
      
      const completionRate = filteredEnrollments.length > 0
        ? (completedCount / filteredEnrollments.length) * 100
        : 0

      analytics.courseBreakdown.push({
        courseId: course.id,
        courseTitle: typeof course.title === 'object' ? course.title.en : course.title,
        enrollments: filteredEnrollments.length,
        revenue: filteredEnrollments.length * (course.price || 0),
        completionRate: Math.round(completionRate),
      })
    }

    return Response.json({ analytics })
  } catch (error) {
    console.error('Analytics error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
