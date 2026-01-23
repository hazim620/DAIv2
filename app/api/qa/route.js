import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { qaDB, usersDB } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const qas = qaDB.getByCourseId(courseId)
    const users = usersDB.getAll()

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

    return NextResponse.json({ qas: enrichedQAs })
  } catch (error) {
    console.error('Get Q&A error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { courseId, question, questionId, answer } = body

    // If questionId is provided, it's an answer
    if (questionId) {
      if (!answer) {
        return NextResponse.json(
          { error: 'Answer is required' },
          { status: 400 }
        )
      }

      const newAnswer = qaDB.addAnswer(questionId, {
        userId: authResult.user.id,
        answer,
      })

      return NextResponse.json({ answer: newAnswer }, { status: 201 })
    }

    // Otherwise, it's a new question
    if (!courseId || !question) {
      return NextResponse.json(
        { error: 'Course ID and question are required' },
        { status: 400 }
      )
    }

    const qa = qaDB.create({
      userId: authResult.user.id,
      courseId: courseId.toString(),
      question,
    })

    return NextResponse.json({ qa }, { status: 201 })
  } catch (error) {
    console.error('Create Q&A error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
