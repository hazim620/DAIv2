'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { PlayCircle, Lock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { formatVideoDuration } from '@/lib/utils'

export default function VideoPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const courseId = params.id
  const videoId = params.videoId
  const [course, setCourse] = useState(null)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchCourse()
    fetchEnrollment()
  }, [courseId, user])

  useEffect(() => {
    if (course && videoId) {
      findVideo()
    }
  }, [course, videoId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}?locale=${locale}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCourse(data.course)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollment = async () => {
    try {
      const response = await fetch('/api/enrollments', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const found = data.enrollments.find(e => e.courseId === courseId.toString())
        setEnrollment(found)
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error)
    }
  }

  const findVideo = () => {
    if (!course) return

    for (const section of course.sections) {
      const video = section.videos.find(v => v.id.toString() === videoId.toString())
      if (video) {
        setCurrentVideo({ ...video, sectionId: section.id, sectionTitle: section.title })
        return
      }
    }
  }

  const handleVideoEnd = async () => {
    if (!enrollment || !currentVideo) return

    // Mark video as watched
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        enrollmentId: enrollment.id,
        videoId: currentVideo.id,
        watched: true,
      }),
    })

    // Refresh enrollment so progress bar and checkmarks update
    if (res.ok) await fetchEnrollment()
  }

  const handleTimeUpdate = async (currentTime, duration) => {
    if (!enrollment || !currentVideo) return

    const progress = (currentTime / duration) * 100
    setVideoProgress(progress)

    // Save progress every 10 seconds
    if (Math.floor(currentTime) % 10 === 0) {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          videoId: currentVideo.id,
          watched: false,
          duration: currentTime,
        }),
      })
    }
  }

  const getNextVideo = () => {
    if (!course || !currentVideo) return null

    let foundCurrent = false
    for (const section of course.sections) {
      for (let i = 0; i < section.videos.length; i++) {
        if (foundCurrent && i < section.videos.length) {
          return { ...section.videos[i], sectionId: section.id, sectionTitle: section.title }
        }
        if (section.videos[i].id.toString() === currentVideo.id.toString()) {
          foundCurrent = true
          if (i + 1 < section.videos.length) {
            return { ...section.videos[i + 1], sectionId: section.id, sectionTitle: section.title }
          }
        }
      }
    }
    return null
  }

  const getPrevVideo = () => {
    if (!course || !currentVideo) return null

    let prevVideo = null
    for (const section of course.sections) {
      for (let i = 0; i < section.videos.length; i++) {
        if (section.videos[i].id.toString() === currentVideo.id.toString()) {
          return prevVideo
        }
        prevVideo = { ...section.videos[i], sectionId: section.id, sectionTitle: section.title }
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!course || !currentVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">{locale === 'ar' ? 'الفيديو غير موجود' : 'Video not found'}</p>
            <Link href={`/courses/${courseId}`}>
              <Button className="mt-4">{locale === 'ar' ? 'العودة للدورة' : 'Back to Course'}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isInstructorOrAdmin = user && course && (course.instructorId === user.id || user.role === 'admin')
  const canWatch = currentVideo.isFree || enrollment || isInstructorOrAdmin
  const nextVideo = getNextVideo()
  const prevVideo = getPrevVideo()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <Link href={`/courses/${courseId}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'العودة للدورة' : 'Back to Course'}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{currentVideo.title}</CardTitle>
                  <CardDescription>{currentVideo.sectionTitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  {canWatch ? (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        className="w-full h-full"
                        controls
                        onEnded={handleVideoEnd}
                        onTimeUpdate={(e) => {
                          const video = e.target
                          handleTimeUpdate(video.currentTime, video.duration)
                        }}
                      >
                        <source src={currentVideo.url ?? currentVideo.videoUrl} type="video/mp4" />
                        {locale === 'ar' ? 'المتصفح لا يدعم تشغيل الفيديو' : 'Your browser does not support video playback'}
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-4">
                          {locale === 'ar'
                            ? 'يرجى التسجيل في الدورة لمشاهدة هذا الفيديو'
                            : 'Please enroll in the course to watch this video'}
                        </p>
                        <Link href={`/courses/${courseId}`}>
                          <Button>{t('enrollNow')}</Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-4">
                    {prevVideo ? (
                      <Link href={`/courses/${courseId}/${prevVideo.id}`}>
                        <Button variant="outline">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          {locale === 'ar' ? 'السابق' : 'Previous'}
                        </Button>
                      </Link>
                    ) : (
                      <div></div>
                    )}
                    {nextVideo ? (
                      <Link href={`/courses/${courseId}/${nextVideo.id}`}>
                        <Button>
                          {locale === 'ar' ? 'التالي' : 'Next'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Content Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {course.sections.map((section) => (
                      <div key={section.id} className="space-y-2">
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                        <div className="space-y-1">
                          {section.videos.map((video) => {
                            const isActive = video.id.toString() === videoId.toString()
                            const isWatched = enrollment?.completedVideos?.includes(video.id.toString())
                            
                            return (
                              <Link
                                key={video.id}
                                href={`/courses/${courseId}/${video.id}`}
                                className={`flex items-center gap-2 p-2 rounded transition-colors ${
                                  isActive
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {video.isFree || enrollment || isInstructorOrAdmin ? (
                                  isWatched ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                                <span className="text-sm flex-1">{video.title}</span>
                                <span className="text-xs opacity-70">{formatVideoDuration(video.duration)}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
