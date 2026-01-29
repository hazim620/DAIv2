import { coursesDB } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    
    const course = await coursesDB.getById(id)
    
    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Format course for the requested locale
    const formattedCourse = {
      ...course,
      title: course.title[locale] || course.title.en,
      description: course.description[locale] || course.description.en,
      sections: course.sections.map(section => ({
        ...section,
        title: section.title[locale] || section.title.en,
        videos: section.videos.map(video => ({
          ...video,
          title: video.title[locale] || video.title.en,
          videoUrl: video.url ?? video.videoUrl,
        })),
      })),
    }

    return Response.json({ course: formattedCourse })
  } catch (error) {
    console.error('Get course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { requireAuth } = await import('@/lib/auth')
    const { coursesDB } = await import('@/lib/db')
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = params
    await coursesDB.delete(id)
    return Response.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
