// PostgreSQL database layer
// Replaces JSON file-based storage with PostgreSQL

import { query } from './postgres.js'
import { hashPassword } from './auth.js'

// Helper function to generate ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// TODO: REMOVE THIS FUNCTION AND TEST USERS BEFORE PRODUCTION DEPLOYMENT
// This function initializes test users for development/testing purposes only
async function initializeTestUsers() {
  try {
    const testUsers = [
      {
        id: 'test-admin-001',
        email: 'admin@admin.com',
        password: hashPassword('1122334455'),
        name: 'Test Admin',
        role: 'admin',
      },
      {
        id: 'test-instructor-001',
        email: 'ins@ins.com',
        password: hashPassword('1122334455'),
        name: 'Test Instructor',
        role: 'instructor',
      },
    ]

    for (const testUser of testUsers) {
      await query(
        `INSERT INTO users (id, email, password, name, role) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO NOTHING`,
        [testUser.id, testUser.email, testUser.password, testUser.name, testUser.role]
      )
    }
  } catch (error) {
    console.error('Error initializing test users:', error)
  }
}

// Users database
export const usersDB = {
  getAll: async () => {
    // TODO: REMOVE THIS CALL BEFORE PRODUCTION - ensures test users exist
    await initializeTestUsers()
    const result = await query('SELECT * FROM users ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      mobileNumber: row.mobile_number,
      nationality: row.nationality,
      countryOfResidence: row.country_of_residence,
      educationLevel: row.education_level,
      dateOfBirth: row.date_of_birth?.toISOString(),
      gender: row.gender,
      universityName: row.university_name,
      major: row.major,
      readinessLevel: row.readiness_level,
      expectedStudentsPerTerm: row.expected_students_per_term,
      howDidYouHear: row.how_did_you_hear,
      emailVerified: row.email_verified || false,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires?.toISOString(),
      accountStatus: row.account_status || 'email_not_verified',
      adminRejectionReason: row.admin_rejection_reason,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires?.toISOString(),
      profileImage: row.profile_image,
      bio: row.bio,
      bankInfo: row.bank_info,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getById: async (id) => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      mobileNumber: row.mobile_number,
      nationality: row.nationality,
      countryOfResidence: row.country_of_residence,
      educationLevel: row.education_level,
      dateOfBirth: row.date_of_birth?.toISOString(),
      gender: row.gender,
      universityName: row.university_name,
      major: row.major,
      readinessLevel: row.readiness_level,
      expectedStudentsPerTerm: row.expected_students_per_term,
      howDidYouHear: row.how_did_you_hear,
      emailVerified: row.email_verified || false,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires?.toISOString(),
      accountStatus: row.account_status || 'email_not_verified',
      adminRejectionReason: row.admin_rejection_reason,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires?.toISOString(),
      profileImage: row.profile_image,
      bio: row.bio,
      bankInfo: row.bank_info,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  getByEmail: async (email) => {
    // TODO: REMOVE THIS CALL BEFORE PRODUCTION - ensures test users exist
    await initializeTestUsers()
    const result = await query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      mobileNumber: row.mobile_number,
      nationality: row.nationality,
      countryOfResidence: row.country_of_residence,
      educationLevel: row.education_level,
      dateOfBirth: row.date_of_birth?.toISOString(),
      gender: row.gender,
      universityName: row.university_name,
      major: row.major,
      readinessLevel: row.readiness_level,
      expectedStudentsPerTerm: row.expected_students_per_term,
      howDidYouHear: row.how_did_you_hear,
      emailVerified: row.email_verified || false,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires?.toISOString(),
      accountStatus: row.account_status || 'email_not_verified',
      adminRejectionReason: row.admin_rejection_reason,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires?.toISOString(),
      profileImage: row.profile_image,
      bio: row.bio,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  create: async (user) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO users (
        id, email, password, name, role,
        first_name, last_name, mobile_number,
        nationality, country_of_residence, education_level, date_of_birth, gender,
        university_name, major, readiness_level, expected_students_per_term, how_did_you_hear,
        email_verified, email_verification_token, email_verification_expires, account_status
      ) 
       VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22
       ) 
       RETURNING *`,
      [
        id, 
        user.email, 
        user.password, 
        user.name || null, 
        user.role || 'student',
        user.firstName || null,
        user.lastName || null,
        user.mobileNumber || null,
        user.nationality || null,
        user.countryOfResidence || null,
        user.educationLevel || null,
        user.dateOfBirth || null,
        user.gender || null,
        user.universityName || null,
        user.major || null,
        user.readinessLevel || null,
        user.expectedStudentsPerTerm || null,
        user.howDidYouHear || null,
        user.emailVerified !== undefined ? user.emailVerified : false,
        user.emailVerificationToken || null,
        user.emailVerificationExpires || null,
        user.accountStatus || 'email_not_verified',
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      mobileNumber: row.mobile_number,
      nationality: row.nationality,
      countryOfResidence: row.country_of_residence,
      educationLevel: row.education_level,
      dateOfBirth: row.date_of_birth?.toISOString(),
      gender: row.gender,
      universityName: row.university_name,
      major: row.major,
      readinessLevel: row.readiness_level,
      expectedStudentsPerTerm: row.expected_students_per_term,
      howDidYouHear: row.how_did_you_hear,
      emailVerified: row.email_verified || false,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires?.toISOString(),
      accountStatus: row.account_status || 'email_not_verified',
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    // Basic fields
    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex++}`)
      values.push(updates.email)
    }
    if (updates.password !== undefined) {
      fields.push(`password = $${paramIndex++}`)
      values.push(updates.password)
    }
    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${paramIndex++}`)
      values.push(updates.role)
    }
    
    // Instructor registration fields
    if (updates.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`)
      values.push(updates.firstName)
    }
    if (updates.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`)
      values.push(updates.lastName)
    }
    if (updates.mobileNumber !== undefined) {
      fields.push(`mobile_number = $${paramIndex++}`)
      values.push(updates.mobileNumber)
    }
    if (updates.nationality !== undefined) {
      fields.push(`nationality = $${paramIndex++}`)
      values.push(updates.nationality)
    }
    if (updates.countryOfResidence !== undefined) {
      fields.push(`country_of_residence = $${paramIndex++}`)
      values.push(updates.countryOfResidence)
    }
    if (updates.educationLevel !== undefined) {
      fields.push(`education_level = $${paramIndex++}`)
      values.push(updates.educationLevel)
    }
    if (updates.dateOfBirth !== undefined) {
      fields.push(`date_of_birth = $${paramIndex++}`)
      values.push(updates.dateOfBirth)
    }
    if (updates.gender !== undefined) {
      fields.push(`gender = $${paramIndex++}`)
      values.push(updates.gender)
    }
    if (updates.universityName !== undefined) {
      fields.push(`university_name = $${paramIndex++}`)
      values.push(updates.universityName)
    }
    if (updates.major !== undefined) {
      fields.push(`major = $${paramIndex++}`)
      values.push(updates.major)
    }
    if (updates.readinessLevel !== undefined) {
      fields.push(`readiness_level = $${paramIndex++}`)
      values.push(updates.readinessLevel)
    }
    if (updates.expectedStudentsPerTerm !== undefined) {
      fields.push(`expected_students_per_term = $${paramIndex++}`)
      values.push(updates.expectedStudentsPerTerm)
    }
    if (updates.howDidYouHear !== undefined) {
      fields.push(`how_did_you_hear = $${paramIndex++}`)
      values.push(updates.howDidYouHear)
    }
    
    // Email verification fields
    if (updates.emailVerified !== undefined) {
      fields.push(`email_verified = $${paramIndex++}`)
      values.push(updates.emailVerified)
    }
    if (updates.emailVerificationToken !== undefined) {
      fields.push(`email_verification_token = $${paramIndex++}`)
      values.push(updates.emailVerificationToken)
    }
    if (updates.emailVerificationExpires !== undefined) {
      fields.push(`email_verification_expires = $${paramIndex++}`)
      values.push(updates.emailVerificationExpires)
    }
    if (updates.accountStatus !== undefined) {
      fields.push(`account_status = $${paramIndex++}`)
      values.push(updates.accountStatus)
    }
    if (updates.adminRejectionReason !== undefined) {
      fields.push(`admin_rejection_reason = $${paramIndex++}`)
      values.push(updates.adminRejectionReason)
    }
    if (updates.passwordResetToken !== undefined) {
      fields.push(`password_reset_token = $${paramIndex++}`)
      values.push(updates.passwordResetToken)
    }
    if (updates.passwordResetExpires !== undefined) {
      fields.push(`password_reset_expires = $${paramIndex++}`)
      values.push(updates.passwordResetExpires)
    }
    if (updates.profileImage !== undefined) {
      fields.push(`profile_image = $${paramIndex++}`)
      values.push(updates.profileImage)
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramIndex++}`)
      values.push(updates.bio)
    }
    if (updates.bankInfo !== undefined) {
      fields.push(`bank_info = $${paramIndex++}`)
      values.push(updates.bankInfo)
    }

    if (fields.length === 0) {
      return await usersDB.getById(id)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  delete: async (id) => {
    await query('DELETE FROM users WHERE id = $1', [id])
    return true
  },
}

// Courses database
export const coursesDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM courses ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      instructorId: row.instructor_id,
      instructor: row.instructor,
      title: row.title,
      description: row.description,
      shortDescription: row.short_description,
      category: row.category,
      level: row.level,
      language: row.language,
      price: parseFloat(row.price) || 0,
      thumbnail: row.thumbnail,
      duration: row.duration,
      students: row.students || 0,
      status: row.status || 'draft',
      sections: row.sections || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getById: async (id) => {
    const result = await query('SELECT * FROM courses WHERE id = $1', [id.toString()])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      instructorId: row.instructor_id,
      instructor: row.instructor,
      title: row.title,
      description: row.description,
      shortDescription: row.short_description,
      category: row.category,
      level: row.level,
      language: row.language,
      price: parseFloat(row.price) || 0,
      thumbnail: row.thumbnail,
      duration: row.duration,
      students: row.students || 0,
      status: row.status || 'draft',
      sections: row.sections || [],
      version: row.version || 1,
      parentCourseId: row.parent_course_id,
      isCurrentVersion: row.is_current_version !== undefined ? row.is_current_version : true,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  getByInstructorId: async (instructorId) => {
    const result = await query('SELECT * FROM courses WHERE instructor_id = $1 ORDER BY created_at DESC', [instructorId])
    return result.rows.map(row => ({
      id: row.id,
      instructorId: row.instructor_id,
      instructor: row.instructor,
      title: row.title,
      description: row.description,
      shortDescription: row.short_description,
      category: row.category,
      level: row.level,
      language: row.language,
      price: parseFloat(row.price) || 0,
      thumbnail: row.thumbnail,
      duration: row.duration,
      students: row.students || 0,
      status: row.status || 'draft',
      sections: row.sections || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  create: async (course) => {
    const id = course.id || generateId()
    const result = await query(
      `INSERT INTO courses (id, instructor_id, instructor, title, description, short_description, category, level, language, price, thumbnail, duration, students, status, sections, version, parent_course_id, is_current_version) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
       RETURNING *`,
      [
        id,
        course.instructorId || null,
        course.instructor || null,
        JSON.stringify(course.title || {}),
        course.description ? JSON.stringify(course.description) : null,
        course.shortDescription || null,
        course.category || null,
        course.level || null,
        course.language || null,
        course.price || 0,
        course.thumbnail || null,
        course.duration || null,
        course.students || 0,
        course.status || 'draft',
        JSON.stringify(course.sections || []),
        course.version || 1,
        course.parentCourseId || null,
        course.isCurrentVersion !== undefined ? course.isCurrentVersion : true,
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      instructorId: row.instructor_id,
      instructor: row.instructor,
      title: row.title,
      description: row.description,
      shortDescription: row.short_description,
      category: row.category,
      level: row.level,
      language: row.language,
      price: parseFloat(row.price) || 0,
      thumbnail: row.thumbnail,
      duration: row.duration,
      students: row.students || 0,
      status: row.status || 'draft',
      sections: row.sections || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    // Check if course versioning is needed
    const currentCourse = await coursesDB.getById(id)
    const needsVersioning = currentCourse && 
                            currentCourse.status === 'published' && 
                            updates.status === 'submitted_for_review' &&
                            !updates.createNewVersion

    if (needsVersioning) {
      // Create new version
      const newVersion = (currentCourse.version || 1) + 1
      const newCourseId = generateId()
      
      // Mark current version as not current
      await query(
        'UPDATE courses SET is_current_version = false WHERE id = $1',
        [id]
      )

      // Create new version
      const newCourse = await coursesDB.create({
        ...currentCourse,
        id: newCourseId,
        parentCourseId: currentCourse.parentCourseId || id,
        version: newVersion,
        isCurrentVersion: true,
        status: 'submitted_for_review',
        ...updates,
      })

      return newCourse
    }

    // Regular update
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.instructorId !== undefined) {
      fields.push(`instructor_id = $${paramIndex++}`)
      values.push(updates.instructorId)
    }
    if (updates.instructor !== undefined) {
      fields.push(`instructor = $${paramIndex++}`)
      values.push(updates.instructor)
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(JSON.stringify(updates.title))
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(updates.description ? JSON.stringify(updates.description) : null)
    }
    if (updates.shortDescription !== undefined) {
      fields.push(`short_description = $${paramIndex++}`)
      values.push(updates.shortDescription)
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`)
      values.push(updates.category)
    }
    if (updates.level !== undefined) {
      fields.push(`level = $${paramIndex++}`)
      values.push(updates.level)
    }
    if (updates.language !== undefined) {
      fields.push(`language = $${paramIndex++}`)
      values.push(updates.language)
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${paramIndex++}`)
      values.push(updates.price)
    }
    if (updates.thumbnail !== undefined) {
      fields.push(`thumbnail = $${paramIndex++}`)
      values.push(updates.thumbnail)
    }
    if (updates.duration !== undefined) {
      fields.push(`duration = $${paramIndex++}`)
      values.push(updates.duration)
    }
    if (updates.students !== undefined) {
      fields.push(`students = $${paramIndex++}`)
      values.push(updates.students)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.sections !== undefined) {
      fields.push(`sections = $${paramIndex++}`)
      values.push(JSON.stringify(updates.sections))
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${paramIndex++}`)
      values.push(updates.version)
    }
    if (updates.parentCourseId !== undefined) {
      fields.push(`parent_course_id = $${paramIndex++}`)
      values.push(updates.parentCourseId)
    }
    if (updates.isCurrentVersion !== undefined) {
      fields.push(`is_current_version = $${paramIndex++}`)
      values.push(updates.isCurrentVersion)
    }

    if (fields.length === 0) {
      return await coursesDB.getById(id)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id.toString())

    const result = await query(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      instructorId: row.instructor_id,
      instructor: row.instructor,
      title: row.title,
      description: row.description,
      shortDescription: row.short_description,
      category: row.category,
      level: row.level,
      language: row.language,
      price: parseFloat(row.price) || 0,
      thumbnail: row.thumbnail,
      duration: row.duration,
      students: row.students || 0,
      status: row.status || 'draft',
      sections: row.sections || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  delete: async (id) => {
    await query('DELETE FROM courses WHERE id = $1', [id.toString()])
    return true
  },
}

// Enrollments database
export const enrollmentsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM enrollments ORDER BY enrolled_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress || 0,
      completedVideos: row.completed_videos || [],
      enrolledAt: row.enrolled_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByUserId: async (userId) => {
    const result = await query('SELECT * FROM enrollments WHERE user_id = $1 ORDER BY enrolled_at DESC', [userId])
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress || 0,
      completedVideos: row.completed_videos || [],
      enrolledAt: row.enrolled_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM enrollments WHERE course_id = $1 ORDER BY enrolled_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress || 0,
      completedVideos: row.completed_videos || [],
      enrolledAt: row.enrolled_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByUserAndCourse: async (userId, courseId) => {
    const result = await query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId.toString()])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress || 0,
      completedVideos: row.completed_videos || [],
      enrolledAt: row.enrolled_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  create: async (enrollment) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO enrollments (id, user_id, course_id, progress, completed_videos) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        id,
        enrollment.userId,
        enrollment.courseId.toString(),
        enrollment.progress || 0,
        enrollment.completedVideos || [],
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress || 0,
      completedVideos: row.completed_videos || [],
      enrolledAt: row.enrolled_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.progress !== undefined) {
      fields.push(`progress = $${paramIndex++}`)
      values.push(updates.progress)
    }
    if (updates.completedVideos !== undefined) {
      fields.push(`completed_videos = $${paramIndex++}`)
      values.push(updates.completedVideos)
    }

    if (fields.length === 0) {
      const result = await query('SELECT * FROM enrollments WHERE id = $1', [id])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        id: row.id,
        userId: row.user_id,
        courseId: row.course_id,
        progress: row.progress || 0,
        completedVideos: row.completed_videos || [],
        enrolledAt: row.enrolled_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE enrollments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress || 0,
      completedVideos: row.completed_videos || [],
      enrolledAt: row.enrolled_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
}

// Progress database
export const progressDB = {
  getByEnrollment: async (enrollmentId) => {
    const result = await query('SELECT * FROM progress WHERE enrollment_id = $1', [enrollmentId])
    return result.rows.map(row => ({
      id: row.id,
      enrollmentId: row.enrollment_id,
      videoId: row.video_id,
      watched: row.watched || false,
      duration: row.duration || 0,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  updateVideoProgress: async (enrollmentId, videoId, watched, duration = 0) => {
    const existing = await query(
      'SELECT * FROM progress WHERE enrollment_id = $1 AND video_id = $2',
      [enrollmentId, videoId.toString()]
    )

    if (existing.rows.length > 0) {
      const result = await query(
        `UPDATE progress SET watched = $1, duration = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE enrollment_id = $3 AND video_id = $4 
         RETURNING *`,
        [watched, duration, enrollmentId, videoId.toString()]
      )
      const row = result.rows[0]
      return {
        id: row.id,
        enrollmentId: row.enrollment_id,
        videoId: row.video_id,
        watched: row.watched || false,
        duration: row.duration || 0,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      }
    } else {
      const id = generateId()
      const result = await query(
        `INSERT INTO progress (id, enrollment_id, video_id, watched, duration) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [id, enrollmentId, videoId.toString(), watched, duration]
      )
      const row = result.rows[0]
      return {
        id: row.id,
        enrollmentId: row.enrollment_id,
        videoId: row.video_id,
        watched: row.watched || false,
        duration: row.duration || 0,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      }
    }
  },
}

// Reviews database
export const reviewsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM reviews ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM reviews WHERE course_id = $1 ORDER BY created_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByUserId: async (userId) => {
    const result = await query('SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByUserAndCourse: async (userId, courseId) => {
    const result = await query('SELECT * FROM reviews WHERE user_id = $1 AND course_id = $2', [userId, courseId.toString()])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  create: async (review) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO reviews (id, user_id, course_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, review.userId, review.courseId.toString(), review.rating, review.comment || null]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.rating !== undefined) {
      fields.push(`rating = $${paramIndex++}`)
      values.push(updates.rating)
    }
    if (updates.comment !== undefined) {
      fields.push(`comment = $${paramIndex++}`)
      values.push(updates.comment)
    }

    if (fields.length === 0) {
      const result = await query('SELECT * FROM reviews WHERE id = $1', [id])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        id: row.id,
        userId: row.user_id,
        courseId: row.course_id,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE reviews SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  delete: async (id) => {
    await query('DELETE FROM reviews WHERE id = $1', [id])
    return true
  },
}

// Q&A database
export const qaDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM qa ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      question: row.question,
      answers: row.answers || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM qa WHERE course_id = $1 ORDER BY created_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      question: row.question,
      answers: row.answers || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getById: async (id) => {
    const result = await query('SELECT * FROM qa WHERE id = $1', [id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      question: row.question,
      answers: row.answers || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  create: async (qa) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO qa (id, user_id, course_id, question, answers) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, qa.userId, qa.courseId.toString(), qa.question, JSON.stringify([])]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      question: row.question,
      answers: row.answers || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  addAnswer: async (questionId, answer) => {
    const existing = await qaDB.getById(questionId)
    if (!existing) return null

    const answers = existing.answers || []
    const newAnswer = {
      id: generateId(),
      ...answer,
      createdAt: new Date().toISOString(),
    }
    answers.push(newAnswer)

    const result = await query(
      `UPDATE qa SET answers = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(answers), questionId]
    )
    return newAnswer
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.question !== undefined) {
      fields.push(`question = $${paramIndex++}`)
      values.push(updates.question)
    }
    if (updates.answers !== undefined) {
      fields.push(`answers = $${paramIndex++}`)
      values.push(JSON.stringify(updates.answers))
    }

    if (fields.length === 0) {
      return await qaDB.getById(id)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE qa SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      question: row.question,
      answers: row.answers || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  delete: async (id) => {
    await query('DELETE FROM qa WHERE id = $1', [id])
    return true
  },
}

// Discussions database
export const discussionsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM discussions ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      title: row.title,
      content: row.content,
      replies: row.replies || [],
      likes: row.likes || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM discussions WHERE course_id = $1 ORDER BY created_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      title: row.title,
      content: row.content,
      replies: row.replies || [],
      likes: row.likes || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getById: async (id) => {
    const result = await query('SELECT * FROM discussions WHERE id = $1', [id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      title: row.title,
      content: row.content,
      replies: row.replies || [],
      likes: row.likes || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  create: async (discussion) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO discussions (id, user_id, course_id, title, content, replies, likes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        id,
        discussion.userId,
        discussion.courseId.toString(),
        discussion.title || null,
        discussion.content,
        JSON.stringify([]),
        [],
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      title: row.title,
      content: row.content,
      replies: row.replies || [],
      likes: row.likes || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  addReply: async (discussionId, reply) => {
    const existing = await discussionsDB.getById(discussionId)
    if (!existing) return null

    const replies = existing.replies || []
    const newReply = {
      id: generateId(),
      ...reply,
      createdAt: new Date().toISOString(),
    }
    replies.push(newReply)

    const result = await query(
      `UPDATE discussions SET replies = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(replies), discussionId]
    )
    return newReply
  },
  toggleLike: async (discussionId, userId) => {
    const existing = await discussionsDB.getById(discussionId)
    if (!existing) return null

    const likes = existing.likes || []
    const likeIndex = likes.indexOf(userId)
    if (likeIndex > -1) {
      likes.splice(likeIndex, 1)
    } else {
      likes.push(userId)
    }

    const result = await query(
      `UPDATE discussions SET likes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [likes, discussionId]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      title: row.title,
      content: row.content,
      replies: row.replies || [],
      likes: row.likes || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`)
      values.push(updates.content)
    }
    if (updates.replies !== undefined) {
      fields.push(`replies = $${paramIndex++}`)
      values.push(JSON.stringify(updates.replies))
    }
    if (updates.likes !== undefined) {
      fields.push(`likes = $${paramIndex++}`)
      values.push(updates.likes)
    }

    if (fields.length === 0) {
      return await discussionsDB.getById(id)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE discussions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      title: row.title,
      content: row.content,
      replies: row.replies || [],
      likes: row.likes || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  delete: async (id) => {
    await query('DELETE FROM discussions WHERE id = $1', [id])
    return true
  },
}

// Course Submissions database (for admin review workflow)
export const courseSubmissionsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM course_submissions ORDER BY submitted_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      status: row.status || 'submitted_for_review',
      adminComments: row.admin_comments || [],
      submittedAt: row.submitted_at?.toISOString(),
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM course_submissions WHERE course_id = $1 ORDER BY submitted_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      status: row.status || 'submitted_for_review',
      adminComments: row.admin_comments || [],
      submittedAt: row.submitted_at?.toISOString(),
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByInstructorId: async (instructorId) => {
    const result = await query('SELECT * FROM course_submissions WHERE instructor_id = $1 ORDER BY submitted_at DESC', [instructorId])
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      status: row.status || 'submitted_for_review',
      adminComments: row.admin_comments || [],
      submittedAt: row.submitted_at?.toISOString(),
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  create: async (submission) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO course_submissions (id, course_id, instructor_id, status, admin_comments) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        id,
        submission.courseId.toString(),
        submission.instructorId,
        submission.status || 'submitted_for_review',
        JSON.stringify([]),
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      status: row.status || 'submitted_for_review',
      adminComments: row.admin_comments || [],
      submittedAt: row.submitted_at?.toISOString(),
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.adminComments !== undefined) {
      fields.push(`admin_comments = $${paramIndex++}`)
      values.push(JSON.stringify(updates.adminComments))
    }

    if (fields.length === 0) {
      const result = await query('SELECT * FROM course_submissions WHERE id = $1', [id])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        id: row.id,
        courseId: row.course_id,
        instructorId: row.instructor_id,
        status: row.status || 'submitted_for_review',
        adminComments: row.admin_comments || [],
        submittedAt: row.submitted_at?.toISOString(),
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE course_submissions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      status: row.status || 'submitted_for_review',
      adminComments: row.admin_comments || [],
      submittedAt: row.submitted_at?.toISOString(),
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  addAdminComment: async (submissionId, comment) => {
    const existing = await query('SELECT * FROM course_submissions WHERE id = $1', [submissionId])
    if (existing.rows.length === 0) return null

    const adminComments = existing.rows[0].admin_comments || []
    const newComment = {
      id: generateId(),
      ...comment,
      createdAt: new Date().toISOString(),
    }
    adminComments.push(newComment)

    const result = await query(
      `UPDATE course_submissions SET admin_comments = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(adminComments), submissionId]
    )
    return newComment
  },
  deleteByCourseId: async (courseId) => {
    await query('DELETE FROM course_submissions WHERE course_id = $1', [courseId.toString()])
  },
}

// Discount codes database (instructor)
export const discountCodesDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM discount_codes ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      instructorId: row.instructor_id,
      code: row.code,
      discountPercent: row.discount_percent,
      startDate: row.start_date?.toISOString?.()?.slice(0, 10),
      endDate: row.end_date?.toISOString?.()?.slice(0, 10),
      maxUses: row.max_uses,
      usedCount: row.used_count || 0,
      createdAt: row.created_at?.toISOString?.(),
    }))
  },
  getById: async (id) => {
    const result = await query('SELECT * FROM discount_codes WHERE id = $1', [id])
    const row = result.rows[0]
    if (!row) return null
    return {
      id: row.id,
      instructorId: row.instructor_id,
      code: row.code,
      discountPercent: row.discount_percent,
      startDate: row.start_date?.toISOString?.()?.slice(0, 10),
      endDate: row.end_date?.toISOString?.()?.slice(0, 10),
      maxUses: row.max_uses,
      usedCount: row.used_count || 0,
      createdAt: row.created_at?.toISOString?.(),
    }
  },
  getByInstructorId: async (instructorId) => {
    const result = await query(
      'SELECT * FROM discount_codes WHERE instructor_id = $1 ORDER BY created_at DESC',
      [instructorId]
    )
    return result.rows.map(row => ({
      id: row.id,
      instructorId: row.instructor_id,
      code: row.code,
      discountPercent: row.discount_percent,
      startDate: row.start_date?.toISOString?.()?.slice(0, 10),
      endDate: row.end_date?.toISOString?.()?.slice(0, 10),
      maxUses: row.max_uses,
      usedCount: row.used_count || 0,
      createdAt: row.created_at?.toISOString?.(),
    }))
  },
  delete: async (id) => {
    await query('DELETE FROM discount_codes WHERE id = $1', [id])
  },
  create: async (data) => {
    const id = generateId()
    await query(
      `INSERT INTO discount_codes (id, instructor_id, code, discount_percent, start_date, end_date, max_uses)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.instructorId,
        data.code.trim().toUpperCase(),
        data.discountPercent,
        data.startDate,
        data.endDate,
        data.maxUses ?? null,
      ]
    )
    return { id, ...data }
  },
}

// Quizzes database
export const quizzesDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM quizzes ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      title: row.title,
      description: row.description,
      passingScore: row.passing_score || 70,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM quizzes WHERE course_id = $1 ORDER BY created_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      title: row.title,
      description: row.description,
      passingScore: row.passing_score || 70,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByLessonId: async (lessonId) => {
    const result = await query('SELECT * FROM quizzes WHERE lesson_id = $1', [lessonId.toString()])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      title: row.title,
      description: row.description,
      passingScore: row.passing_score || 70,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  getById: async (id) => {
    const result = await query('SELECT * FROM quizzes WHERE id = $1', [id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      title: row.title,
      description: row.description,
      passingScore: row.passing_score || 70,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  create: async (quiz) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO quizzes (id, course_id, lesson_id, title, description, passing_score, time_limit, questions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        id,
        quiz.courseId.toString(),
        quiz.lessonId || null,
        quiz.title,
        quiz.description || null,
        quiz.passingScore || 70,
        quiz.timeLimit || null,
        JSON.stringify(quiz.questions || []),
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      title: row.title,
      description: row.description,
      passingScore: row.passing_score || 70,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.passingScore !== undefined) {
      fields.push(`passing_score = $${paramIndex++}`)
      values.push(updates.passingScore)
    }
    if (updates.timeLimit !== undefined) {
      fields.push(`time_limit = $${paramIndex++}`)
      values.push(updates.timeLimit)
    }
    if (updates.questions !== undefined) {
      fields.push(`questions = $${paramIndex++}`)
      values.push(JSON.stringify(updates.questions))
    }

    if (fields.length === 0) {
      return await quizzesDB.getById(id)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE quizzes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      title: row.title,
      description: row.description,
      passingScore: row.passing_score || 70,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  addQuestion: async (quizId, question) => {
    const existing = await quizzesDB.getById(quizId)
    if (!existing) return null

    const questions = existing.questions || []
    const newQuestion = {
      id: generateId(),
      ...question,
      createdAt: new Date().toISOString(),
    }
    questions.push(newQuestion)

    const result = await query(
      `UPDATE quizzes SET questions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(questions), quizId]
    )
    return newQuestion
  },
  delete: async (id) => {
    await query('DELETE FROM quizzes WHERE id = $1', [id])
    return true
  },
}

// Announcements database
export const announcementsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM announcements ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      title: row.title,
      content: row.content,
      scheduledFor: row.scheduled_for?.toISOString(),
      isPublished: row.is_published || true,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query('SELECT * FROM announcements WHERE course_id = $1 ORDER BY created_at DESC', [courseId.toString()])
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      title: row.title,
      content: row.content,
      scheduledFor: row.scheduled_for?.toISOString(),
      isPublished: row.is_published || true,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  getByInstructorId: async (instructorId) => {
    const result = await query('SELECT * FROM announcements WHERE instructor_id = $1 ORDER BY created_at DESC', [instructorId])
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      title: row.title,
      content: row.content,
      scheduledFor: row.scheduled_for?.toISOString(),
      isPublished: row.is_published || true,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }))
  },
  create: async (announcement) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO announcements (id, course_id, instructor_id, title, content, scheduled_for, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        id,
        announcement.courseId.toString(),
        announcement.instructorId,
        announcement.title,
        announcement.content,
        announcement.scheduledFor ? new Date(announcement.scheduledFor) : null,
        announcement.isPublished !== undefined ? announcement.isPublished : true,
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      title: row.title,
      content: row.content,
      scheduledFor: row.scheduled_for?.toISOString(),
      isPublished: row.is_published || true,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  update: async (id, updates) => {
    const fields = []
    const values = []
    let paramIndex = 1

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`)
      values.push(updates.content)
    }
    if (updates.scheduledFor !== undefined) {
      fields.push(`scheduled_for = $${paramIndex++}`)
      values.push(updates.scheduledFor ? new Date(updates.scheduledFor) : null)
    }
    if (updates.isPublished !== undefined) {
      fields.push(`is_published = $${paramIndex++}`)
      values.push(updates.isPublished)
    }

    if (fields.length === 0) {
      const result = await query('SELECT * FROM announcements WHERE id = $1', [id])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        id: row.id,
        courseId: row.course_id,
        instructorId: row.instructor_id,
        title: row.title,
        content: row.content,
        scheduledFor: row.scheduled_for?.toISOString(),
        isPublished: row.is_published || true,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const result = await query(
      `UPDATE announcements SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      instructorId: row.instructor_id,
      title: row.title,
      content: row.content,
      scheduledFor: row.scheduled_for?.toISOString(),
      isPublished: row.is_published || true,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    }
  },
  delete: async (id) => {
    await query('DELETE FROM announcements WHERE id = $1', [id])
    return true
  },
}

// Course Status History (audit trail)
export const courseStatusHistoryDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM course_status_history ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      status: row.status,
      changedBy: row.changed_by,
      changedByRole: row.changed_by_role,
      reason: row.reason,
      createdAt: row.created_at?.toISOString(),
    }))
  },
  getByCourseId: async (courseId) => {
    const result = await query(
      'SELECT * FROM course_status_history WHERE course_id = $1 ORDER BY created_at DESC',
      [courseId.toString()]
    )
    return result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      status: row.status,
      changedBy: row.changed_by,
      changedByRole: row.changed_by_role,
      reason: row.reason,
      createdAt: row.created_at?.toISOString(),
    }))
  },
  create: async (historyEntry) => {
    const id = generateId()
    const result = await query(
      `INSERT INTO course_status_history (id, course_id, status, changed_by, changed_by_role, reason) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        id,
        historyEntry.courseId.toString(),
        historyEntry.status,
        historyEntry.changedBy || null,
        historyEntry.changedByRole || null,
        historyEntry.reason || null,
      ]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      courseId: row.course_id,
      status: row.status,
      changedBy: row.changed_by,
      changedByRole: row.changed_by_role,
      reason: row.reason,
      createdAt: row.created_at?.toISOString(),
    }
  },
  deleteByCourseId: async (courseId) => {
    await query('DELETE FROM course_status_history WHERE course_id = $1', [courseId.toString()])
  },
}
