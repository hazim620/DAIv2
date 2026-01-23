// Simple JSON-based database layer
// This can be easily replaced with a real database (MongoDB, PostgreSQL, etc.)

import fs from 'fs'
import path from 'path'

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

// Users database
export const usersDB = {
  getAll: () => readData('users.json', []),
  getById: (id) => {
    const users = readData('users.json', [])
    return users.find(u => u.id === id)
  },
  getByEmail: (email) => {
    const users = readData('users.json', [])
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
  create: (course) => {
    const courses = readData('courses.json', getDefaultCourses())
    const newCourse = {
      id: Date.now().toString(),
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
