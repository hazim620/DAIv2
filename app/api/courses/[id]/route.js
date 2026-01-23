import { NextResponse } from 'next/server'
import { coursesDB } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    
    const course = coursesDB.getById(id)
    
    if (!course) {
      return NextResponse.json(
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
        })),
      })),
    }

    return NextResponse.json({ course: formattedCourse })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
