import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { enrollmentsDB, coursesDB, progressDB, usersDB } from '@/lib/db'

// Get all students for instructor's courses
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      )
    }

    const instructorId = user.id
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    // Get instructor's courses
    const instructorCourses = coursesDB.getByInstructorId(instructorId)
    
    if (courseId) {
      // Get students for a specific course
      const course = coursesDB.getById(courseId)
      if (!course || course.instructorId !== instructorId) {
        return NextResponse.json(
          { error: 'Course not found or unauthorized' },
          { status: 404 }
        )
      }

      const enrollments = enrollmentsDB.getByCourseId(courseId)
      const students = enrollments.map(enrollment => {
        const student = usersDB.getById(enrollment.userId)
        const progress = progressDB.getByEnrollment(enrollment.id)
        
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
      })

      return NextResponse.json({ 
        course: {
          id: course.id,
          title: course.title,
        },
        students,
      })
    } else {
      // Get all students across all courses
      const allStudents = []
      
      instructorCourses.forEach(course => {
        const enrollments = enrollmentsDB.getByCourseId(course.id)
        enrollments.forEach(enrollment => {
          const student = usersDB.getById(enrollment.userId)
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
        })
      })

      return NextResponse.json({ students: allStudents })
    }
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
