import { requireAuth } from '@/lib/auth'
import { enrollmentsDB, coursesDB, progressDB, usersDB } from '@/lib/db'

// Get all students for instructor's courses
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

    const instructorId = user.id
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    // Get instructor's courses
    const instructorCourses = await coursesDB.getByInstructorId(instructorId)
    
    if (courseId) {
      // Get students for a specific course
      const course = await coursesDB.getById(courseId)
      if (!course || course.instructorId !== instructorId) {
        return Response.json(
          { error: 'Course not found or unauthorized' },
          { status: 404 }
        )
      }

      const enrollments = await enrollmentsDB.getByCourseId(courseId)
      const students = await Promise.all(enrollments.map(async (enrollment) => {
        const student = await usersDB.getById(enrollment.userId)
        const progressData = await progressDB.getByEnrollment(enrollment.id)
        
        // Calculate completion percentage
        const totalVideos = course.sections?.reduce((sum, section) => 
          sum + (section.videos?.length || 0), 0) || 0
        const completedVideos = enrollment.completedVideos?.length || 0
        const completionPercentage = totalVideos > 0 
          ? Math.round((completedVideos / totalVideos) * 100) 
          : 0

        return {
          enrollmentId: enrollment.id,
          studentId: student?.id,
          name: student?.name || 'Unknown',
          email: student?.email || 'Unknown',
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress || 0,
          completedVideos: completedVideos,
          totalVideos: totalVideos,
          completionPercentage,
          lastActivity: enrollment.updatedAt,
        }
      }))

      return Response.json({ 
        course: {
          id: course.id,
          title: course.title,
        },
        students,
      })
    } else {
      // Get all students across all courses
      const allStudents = []
      
      for (const course of instructorCourses) {
        const enrollments = await enrollmentsDB.getByCourseId(course.id)
        for (const enrollment of enrollments) {
          const student = await usersDB.getById(enrollment.userId)
          if (student) {
            allStudents.push({
              courseId: course.id,
              courseTitle: course.title,
              studentId: student.id,
              name: student.name || 'Unknown',
              email: student.email,
              enrolledAt: enrollment.enrolledAt,
              progress: enrollment.progress || 0,
            })
          }
        }
      }

      return Response.json({ students: allStudents })
    }
  } catch (error) {
    console.error('Get students error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
