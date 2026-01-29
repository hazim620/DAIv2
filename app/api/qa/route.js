import { requireAuth } from '@/lib/auth'
import { qaDB, usersDB, coursesDB } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return Response.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const qas = await qaDB.getByCourseId(courseId)
    const users = await usersDB.getAll()

    // Enrich Q&As with user data
    const enrichedQAs = qas.map(qa => {
      const user = users.find(u => u.id === qa.userId)
      const enrichedAnswers = (qa.answers || []).map(answer => {
        const answerUser = users.find(u => u.id === answer.userId)
        return {
          ...answer,
          user: answerUser ? {
            id: answerUser.id,
            name: answerUser.name,
            email: answerUser.email,
          } : null,
        }
      })

      return {
        ...qa,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : null,
        answers: enrichedAnswers,
      }
    })

    return Response.json({ qas: enrichedQAs })
  } catch (error) {
    console.error('Get Q&A error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { courseId, question, questionId, answer } = body

    // If questionId is provided, it's an answer — only course instructor (or admin) may answer
    if (questionId) {
      if (!answer) {
        return Response.json(
          { error: 'Answer is required' },
          { status: 400 }
        )
      }

      const question = await qaDB.getById(questionId)
      if (!question) {
        return Response.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      const course = await coursesDB.getById(question.courseId)
      if (!course) {
        return Response.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }

      const isInstructorOrAdmin =
        course.instructorId === authResult.user.id ||
        authResult.user.role === 'admin'
      if (!isInstructorOrAdmin) {
        return Response.json(
          { error: 'Only the course instructor can answer questions' },
          { status: 403 }
        )
      }

      const newAnswer = await qaDB.addAnswer(questionId, {
        userId: authResult.user.id,
        answer,
      })

      return Response.json({ answer: newAnswer }, { status: 201 })
    }

    // Otherwise, it's a new question
    if (!courseId || !question) {
      return Response.json(
        { error: 'Course ID and question are required' },
        { status: 400 }
      )
    }

    const qa = await qaDB.create({
      userId: authResult.user.id,
      courseId: courseId.toString(),
      question,
    })

    return Response.json({ qa }, { status: 201 })
  } catch (error) {
    console.error('Create Q&A error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
