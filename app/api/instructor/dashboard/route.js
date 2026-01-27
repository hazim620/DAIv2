import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { coursesDB, enrollmentsDB, reviewsDB, courseSubmissionsDB } from '@/lib/db'

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
    
    // Get all instructor courses
    const allCourses = coursesDB.getByInstructorId(instructorId)
    
    // Calculate statistics
    const totalCourses = allCourses.length
    const publishedCourses = allCourses.filter(c => c.status === 'published').length
    const draftCourses = allCourses.filter(c => c.status === 'draft').length
    const submittedCourses = allCourses.filter(c => c.status === 'submitted_for_review').length
    const changesRequestedCourses = allCourses.filter(c => c.status === 'changes_requested').length
    const approvedCourses = allCourses.filter(c => c.status === 'approved').length
    
    // Calculate total students across all courses
    let totalStudents = 0
    let totalRevenue = 0
    
    allCourses.forEach(course => {
      const enrollments = enrollmentsDB.getByCourseId(course.id)
      totalStudents += enrollments.length
      totalRevenue += enrollments.length * (course.price || 0)
    })
    
    // Get course status breakdown
    const statusBreakdown = {
      draft: draftCourses,
      submitted_for_review: submittedCourses,
      changes_requested: changesRequestedCourses,
      approved: approvedCourses,
      published: publishedCourses,
    }
    
    // Get recent notifications (submissions with admin comments)
    const submissions = courseSubmissionsDB.getByInstructorId(instructorId)
    const recentNotifications = submissions
      .filter(s => s.adminComments && s.adminComments.length > 0)
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        courseId: s.courseId,
        courseTitle: allCourses.find(c => c.id === s.courseId)?.title?.en || 'Unknown Course',
        message: `Admin commented on your course submission`,
        type: 'admin_comment',
        createdAt: s.updatedAt,
      }))
    
    // Get recent enrollments
    const recentEnrollments = []
    allCourses.forEach(course => {
      const enrollments = enrollmentsDB.getByCourseId(course.id)
      enrollments.slice(0, 3).forEach(enrollment => {
        recentEnrollments.push({
          courseId: course.id,
          courseTitle: course.title?.en || 'Unknown Course',
          studentId: enrollment.userId,
          enrolledAt: enrollment.enrolledAt,
        })
      })
    })
    recentEnrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
    
    return NextResponse.json({
      summary: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        totalRevenue,
      },
      statusBreakdown,
      recentNotifications: recentNotifications.slice(0, 10),
      recentEnrollments: recentEnrollments.slice(0, 10),
    })
  } catch (error) {
    console.error('Instructor dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
