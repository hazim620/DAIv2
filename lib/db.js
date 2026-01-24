// Simple JSON-based database layer
// This can be easily replaced with a real database (MongoDB, PostgreSQL, etc.)

import fs from 'fs'
import path from 'path'
import { hashPassword } from './auth.js'

const DATA_DIR = path.join(process.cwd(), 'data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Helper functions
function getFilePath(filename) {
  return path.join(DATA_DIR, filename)
}

function readData(filename, defaultValue = []) {
  try {
    const filePath = getFilePath(filename)
    if (!fs.existsSync(filePath)) {
      return defaultValue
    }
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return defaultValue
  }
}

function writeData(filename, data) {
  try {
    const filePath = getFilePath(filename)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    return false
  }
}

// TODO: REMOVE THIS FUNCTION AND TEST USERS BEFORE PRODUCTION DEPLOYMENT
// This function initializes test users for development/testing purposes only
function initializeTestUsers() {
  const users = readData('users.json', [])
  const testUsers = [
    {
      id: 'test-admin-001',
      email: 'admin@admin.com',
      password: hashPassword('1122334455'),
      name: 'Test Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test-instructor-001',
      email: 'ins@ins.com',
      password: hashPassword('1122334455'),
      name: 'Test Instructor',
      role: 'instructor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  let needsUpdate = false
  testUsers.forEach((testUser) => {
    const exists = users.find((u) => u.email === testUser.email)
    if (!exists) {
      users.push(testUser)
      needsUpdate = true
    }
  })

  if (needsUpdate) {
    writeData('users.json', users)
  }

  return users
}

// Users database
export const usersDB = {
  getAll: () => {
    // TODO: REMOVE THIS CALL BEFORE PRODUCTION - ensures test users exist
    return initializeTestUsers()
  },
  getById: (id) => {
    const users = readData('users.json', [])
    return users.find(u => u.id === id)
  },
  getByEmail: (email) => {
    // TODO: REMOVE THIS CALL BEFORE PRODUCTION - ensures test users exist
    const users = initializeTestUsers()
    return users.find(u => u.email === email)
  },
  create: (user) => {
    const users = readData('users.json', [])
    const newUser = {
      id: Date.now().toString(),
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    users.push(newUser)
    writeData('users.json', users)
    return newUser
  },
  update: (id, updates) => {
    const users = readData('users.json', [])
    const index = users.findIndex(u => u.id === id)
    if (index === -1) return null
    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('users.json', users)
    return users[index]
  },
  delete: (id) => {
    const users = readData('users.json', [])
    const filtered = users.filter(u => u.id !== id)
    writeData('users.json', filtered)
    return true
  },
}

// Courses database
export const coursesDB = {
  getAll: () => readData('courses.json', getDefaultCourses()),
  getById: (id) => {
    const courses = readData('courses.json', getDefaultCourses())
    return courses.find(c => c.id === id.toString())
  },
  getByInstructorId: (instructorId) => {
    const courses = readData('courses.json', getDefaultCourses())
    return courses.filter(c => c.instructorId === instructorId)
  },
  create: (course) => {
    const courses = readData('courses.json', getDefaultCourses())
    const newCourse = {
      id: Date.now().toString(),
      status: 'draft', // draft, submitted_for_review, changes_requested, approved, published
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    courses.push(newCourse)
    writeData('courses.json', courses)
    return newCourse
  },
  update: (id, updates) => {
    const courses = readData('courses.json', getDefaultCourses())
    const index = courses.findIndex(c => c.id === id.toString())
    if (index === -1) return null
    courses[index] = {
      ...courses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('courses.json', courses)
    return courses[index]
  },
  delete: (id) => {
    const courses = readData('courses.json', getDefaultCourses())
    const filtered = courses.filter(c => c.id !== id.toString())
    writeData('courses.json', filtered)
    return true
  },
}

// Enrollments database
export const enrollmentsDB = {
  getAll: () => readData('enrollments.json', []),
  getByUserId: (userId) => {
    const enrollments = readData('enrollments.json', [])
    return enrollments.filter(e => e.userId === userId)
  },
  getByCourseId: (courseId) => {
    const enrollments = readData('enrollments.json', [])
    return enrollments.filter(e => e.courseId === courseId.toString())
  },
  getByUserAndCourse: (userId, courseId) => {
    const enrollments = readData('enrollments.json', [])
    return enrollments.find(e => e.userId === userId && e.courseId === courseId.toString())
  },
  create: (enrollment) => {
    const enrollments = readData('enrollments.json', [])
    const newEnrollment = {
      id: Date.now().toString(),
      ...enrollment,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      completedVideos: [],
    }
    enrollments.push(newEnrollment)
    writeData('enrollments.json', enrollments)
    return newEnrollment
  },
  update: (id, updates) => {
    const enrollments = readData('enrollments.json', [])
    const index = enrollments.findIndex(e => e.id === id)
    if (index === -1) return null
    enrollments[index] = {
      ...enrollments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('enrollments.json', enrollments)
    return enrollments[index]
  },
}

// Progress database
export const progressDB = {
  getByEnrollment: (enrollmentId) => {
    const progress = readData('progress.json', [])
    return progress.filter(p => p.enrollmentId === enrollmentId)
  },
  updateVideoProgress: (enrollmentId, videoId, watched, duration = 0) => {
    const progress = readData('progress.json', [])
    const existing = progress.find(
      p => p.enrollmentId === enrollmentId && p.videoId === videoId.toString()
    )
    
    if (existing) {
      existing.watched = watched
      existing.duration = duration
      existing.updatedAt = new Date().toISOString()
      writeData('progress.json', progress)
      return existing
    } else {
      const newProgress = {
        id: Date.now().toString(),
        enrollmentId,
        videoId: videoId.toString(),
        watched,
        duration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      progress.push(newProgress)
      writeData('progress.json', progress)
      return newProgress
    }
  },
}

// Reviews database
export const reviewsDB = {
  getAll: () => readData('reviews.json', []),
  getByCourseId: (courseId) => {
    const reviews = readData('reviews.json', [])
    return reviews.filter(r => r.courseId === courseId.toString())
  },
  getByUserId: (userId) => {
    const reviews = readData('reviews.json', [])
    return reviews.filter(r => r.userId === userId)
  },
  getByUserAndCourse: (userId, courseId) => {
    const reviews = readData('reviews.json', [])
    return reviews.find(r => r.userId === userId && r.courseId === courseId.toString())
  },
  create: (review) => {
    const reviews = readData('reviews.json', [])
    const newReview = {
      id: Date.now().toString(),
      ...review,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    reviews.push(newReview)
    writeData('reviews.json', reviews)
    return newReview
  },
  update: (id, updates) => {
    const reviews = readData('reviews.json', [])
    const index = reviews.findIndex(r => r.id === id)
    if (index === -1) return null
    reviews[index] = {
      ...reviews[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('reviews.json', reviews)
    return reviews[index]
  },
  delete: (id) => {
    const reviews = readData('reviews.json', [])
    const filtered = reviews.filter(r => r.id !== id)
    writeData('reviews.json', filtered)
    return true
  },
}

// Q&A database
export const qaDB = {
  getAll: () => readData('qa.json', []),
  getByCourseId: (courseId) => {
    const qas = readData('qa.json', [])
    return qas.filter(q => q.courseId === courseId.toString())
  },
  getById: (id) => {
    const qas = readData('qa.json', [])
    return qas.find(q => q.id === id)
  },
  create: (qa) => {
    const qas = readData('qa.json', [])
    const newQA = {
      id: Date.now().toString(),
      ...qa,
      answers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    qas.push(newQA)
    writeData('qa.json', qas)
    return newQA
  },
  addAnswer: (questionId, answer) => {
    const qas = readData('qa.json', [])
    const index = qas.findIndex(q => q.id === questionId)
    if (index === -1) return null
    
    const newAnswer = {
      id: Date.now().toString(),
      ...answer,
      createdAt: new Date().toISOString(),
    }
    qas[index].answers = qas[index].answers || []
    qas[index].answers.push(newAnswer)
    qas[index].updatedAt = new Date().toISOString()
    writeData('qa.json', qas)
    return newAnswer
  },
  update: (id, updates) => {
    const qas = readData('qa.json', [])
    const index = qas.findIndex(q => q.id === id)
    if (index === -1) return null
    qas[index] = {
      ...qas[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('qa.json', qas)
    return qas[index]
  },
  delete: (id) => {
    const qas = readData('qa.json', [])
    const filtered = qas.filter(q => q.id !== id)
    writeData('qa.json', filtered)
    return true
  },
}

// Discussions database
export const discussionsDB = {
  getAll: () => readData('discussions.json', []),
  getByCourseId: (courseId) => {
    const discussions = readData('discussions.json', [])
    return discussions.filter(d => d.courseId === courseId.toString())
  },
  getById: (id) => {
    const discussions = readData('discussions.json', [])
    return discussions.find(d => d.id === id)
  },
  create: (discussion) => {
    const discussions = readData('discussions.json', [])
    const newDiscussion = {
      id: Date.now().toString(),
      ...discussion,
      replies: [],
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    discussions.push(newDiscussion)
    writeData('discussions.json', discussions)
    return newDiscussion
  },
  addReply: (discussionId, reply) => {
    const discussions = readData('discussions.json', [])
    const index = discussions.findIndex(d => d.id === discussionId)
    if (index === -1) return null
    
    const newReply = {
      id: Date.now().toString(),
      ...reply,
      createdAt: new Date().toISOString(),
    }
    discussions[index].replies = discussions[index].replies || []
    discussions[index].replies.push(newReply)
    discussions[index].updatedAt = new Date().toISOString()
    writeData('discussions.json', discussions)
    return newReply
  },
  toggleLike: (discussionId, userId) => {
    const discussions = readData('discussions.json', [])
    const index = discussions.findIndex(d => d.id === discussionId)
    if (index === -1) return null
    
    const likes = discussions[index].likes || []
    const likeIndex = likes.indexOf(userId)
    if (likeIndex > -1) {
      likes.splice(likeIndex, 1)
    } else {
      likes.push(userId)
    }
    discussions[index].likes = likes
    discussions[index].updatedAt = new Date().toISOString()
    writeData('discussions.json', discussions)
    return discussions[index]
  },
  update: (id, updates) => {
    const discussions = readData('discussions.json', [])
    const index = discussions.findIndex(d => d.id === id)
    if (index === -1) return null
    discussions[index] = {
      ...discussions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('discussions.json', discussions)
    return discussions[index]
  },
  delete: (id) => {
    const discussions = readData('discussions.json', [])
    const filtered = discussions.filter(d => d.id !== id)
    writeData('discussions.json', filtered)
    return true
  },
}

// Default courses data
function getDefaultCourses() {
  return [
    {
      id: '1',
      title: {
        en: 'Introduction to Data Science',
        ar: 'مقدمة في علوم البيانات',
      },
      description: {
        en: 'Learn the fundamentals of data science from scratch',
        ar: 'تعلم أساسيات علوم البيانات من الصفر',
      },
      instructor: 'Dr. Ahmed Ali',
      duration: '10 hours',
      students: 1250,
      price: 99,
      thumbnail: '/api/placeholder/400/250',
      sections: [
        {
          id: 1,
          title: {
            en: 'Section 1: Introduction',
            ar: 'القسم الأول: المقدمة',
          },
          videos: [
            {
              id: 1,
              title: {
                en: 'What is Data Science?',
                ar: 'ما هي علوم البيانات؟',
              },
              duration: '15:30',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              isFree: true,
            },
            {
              id: 2,
              title: {
                en: 'Data Science Tools',
                ar: 'أدوات علوم البيانات',
              },
              duration: '20:45',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
              isFree: false,
            },
            {
              id: 3,
              title: {
                en: 'Setting Up Environment',
                ar: 'إعداد البيئة',
              },
              duration: '12:20',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              isFree: false,
            },
          ],
        },
        {
          id: 2,
          title: {
            en: 'Section 2: Python Basics',
            ar: 'القسم الثاني: أساسيات Python',
          },
          videos: [
            {
              id: 4,
              title: {
                en: 'Introduction to Python',
                ar: 'مقدمة إلى Python',
              },
              duration: '18:15',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              isFree: false,
            },
            {
              id: 5,
              title: {
                en: 'Data Structures',
                ar: 'البيانات والهياكل',
              },
              duration: '25:30',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
              isFree: false,
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: {
        en: 'Machine Learning & AI',
        ar: 'تعلم الآلة والذكاء الاصطناعي',
      },
      description: {
        en: 'Comprehensive course on machine learning and AI',
        ar: 'دورة شاملة في تعلم الآلة والذكاء الاصطناعي',
      },
      instructor: 'Prof. Sarah Johnson',
      duration: '15 hours',
      students: 2100,
      price: 149,
      thumbnail: '/api/placeholder/400/250',
      sections: [
        {
          id: 1,
          title: {
            en: 'Section 1: ML Fundamentals',
            ar: 'القسم الأول: أساسيات تعلم الآلة',
          },
          videos: [
            {
              id: 1,
              title: {
                en: 'Introduction to Machine Learning',
                ar: 'مقدمة في تعلم الآلة',
              },
              duration: '22:10',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
              isFree: true,
            },
            {
              id: 2,
              title: {
                en: 'Supervised Learning',
                ar: 'التعلم الخاضع للإشراف',
              },
              duration: '28:45',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
              isFree: false,
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: {
        en: 'Data Analysis with Python',
        ar: 'تحليل البيانات باستخدام Python',
      },
      description: {
        en: 'Use Python to analyze data and create reports',
        ar: 'استخدم Python لتحليل البيانات وإنشاء التقارير',
      },
      instructor: 'Eng. Mohammed Hassan',
      duration: '12 hours',
      students: 980,
      price: 79,
      thumbnail: '/api/placeholder/400/250',
      sections: [
        {
          id: 1,
          title: {
            en: 'Section 1: Python for Data',
            ar: 'القسم الأول: Python للبيانات',
          },
          videos: [
            {
              id: 1,
              title: {
                en: 'Pandas Basics',
                ar: 'أساسيات Pandas',
              },
              duration: '25:00',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
              isFree: true,
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

// Course Submissions database (for admin review workflow)
export const courseSubmissionsDB = {
  getAll: () => readData('course-submissions.json', []),
  getByCourseId: (courseId) => {
    const submissions = readData('course-submissions.json', [])
    return submissions.filter(s => s.courseId === courseId.toString())
  },
  getByInstructorId: (instructorId) => {
    const submissions = readData('course-submissions.json', [])
    return submissions.filter(s => s.instructorId === instructorId)
  },
  create: (submission) => {
    const submissions = readData('course-submissions.json', [])
    const newSubmission = {
      id: Date.now().toString(),
      ...submission,
      status: 'submitted_for_review',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    submissions.push(newSubmission)
    writeData('course-submissions.json', submissions)
    return newSubmission
  },
  update: (id, updates) => {
    const submissions = readData('course-submissions.json', [])
    const index = submissions.findIndex(s => s.id === id)
    if (index === -1) return null
    submissions[index] = {
      ...submissions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('course-submissions.json', submissions)
    return submissions[index]
  },
  addAdminComment: (submissionId, comment) => {
    const submissions = readData('course-submissions.json', [])
    const index = submissions.findIndex(s => s.id === submissionId)
    if (index === -1) return null
    
    const newComment = {
      id: Date.now().toString(),
      ...comment,
      createdAt: new Date().toISOString(),
    }
    submissions[index].adminComments = submissions[index].adminComments || []
    submissions[index].adminComments.push(newComment)
    submissions[index].updatedAt = new Date().toISOString()
    writeData('course-submissions.json', submissions)
    return newComment
  },
}

// Quizzes database
export const quizzesDB = {
  getAll: () => readData('quizzes.json', []),
  getByCourseId: (courseId) => {
    const quizzes = readData('quizzes.json', [])
    return quizzes.filter(q => q.courseId === courseId.toString())
  },
  getByLessonId: (lessonId) => {
    const quizzes = readData('quizzes.json', [])
    return quizzes.find(q => q.lessonId === lessonId.toString())
  },
  getById: (id) => {
    const quizzes = readData('quizzes.json', [])
    return quizzes.find(q => q.id === id)
  },
  create: (quiz) => {
    const quizzes = readData('quizzes.json', [])
    const newQuiz = {
      id: Date.now().toString(),
      ...quiz,
      questions: quiz.questions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    quizzes.push(newQuiz)
    writeData('quizzes.json', quizzes)
    return newQuiz
  },
  update: (id, updates) => {
    const quizzes = readData('quizzes.json', [])
    const index = quizzes.findIndex(q => q.id === id)
    if (index === -1) return null
    quizzes[index] = {
      ...quizzes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('quizzes.json', quizzes)
    return quizzes[index]
  },
  addQuestion: (quizId, question) => {
    const quizzes = readData('quizzes.json', [])
    const index = quizzes.findIndex(q => q.id === quizId)
    if (index === -1) return null
    
    const newQuestion = {
      id: Date.now().toString(),
      ...question,
      createdAt: new Date().toISOString(),
    }
    quizzes[index].questions = quizzes[index].questions || []
    quizzes[index].questions.push(newQuestion)
    quizzes[index].updatedAt = new Date().toISOString()
    writeData('quizzes.json', quizzes)
    return newQuestion
  },
  delete: (id) => {
    const quizzes = readData('quizzes.json', [])
    const filtered = quizzes.filter(q => q.id !== id)
    writeData('quizzes.json', filtered)
    return true
  },
}

// Announcements database
export const announcementsDB = {
  getAll: () => readData('announcements.json', []),
  getByCourseId: (courseId) => {
    const announcements = readData('announcements.json', [])
    return announcements.filter(a => a.courseId === courseId.toString())
  },
  getByInstructorId: (instructorId) => {
    const announcements = readData('announcements.json', [])
    return announcements.filter(a => a.instructorId === instructorId)
  },
  create: (announcement) => {
    const announcements = readData('announcements.json', [])
    const newAnnouncement = {
      id: Date.now().toString(),
      ...announcement,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    announcements.push(newAnnouncement)
    writeData('announcements.json', announcements)
    return newAnnouncement
  },
  update: (id, updates) => {
    const announcements = readData('announcements.json', [])
    const index = announcements.findIndex(a => a.id === id)
    if (index === -1) return null
    announcements[index] = {
      ...announcements[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData('announcements.json', announcements)
    return announcements[index]
  },
  delete: (id) => {
    const announcements = readData('announcements.json', [])
    const filtered = announcements.filter(a => a.id !== id)
    writeData('announcements.json', filtered)
    return true
  },
}

// Course Status History (audit trail)
export const courseStatusHistoryDB = {
  getAll: () => readData('course-status-history.json', []),
  getByCourseId: (courseId) => {
    const history = readData('course-status-history.json', [])
    return history.filter(h => h.courseId === courseId.toString()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  },
  create: (historyEntry) => {
    const history = readData('course-status-history.json', [])
    const newEntry = {
      id: Date.now().toString(),
      ...historyEntry,
      createdAt: new Date().toISOString(),
    }
    history.push(newEntry)
    writeData('course-status-history.json', history)
    return newEntry
  },
}
