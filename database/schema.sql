-- UUID extension: run database/bootstrap.sql once as superuser if you need uuid-ossp.
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'student',
  bank_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(255) PRIMARY KEY,
  instructor_id VARCHAR(255) REFERENCES users(id),
  instructor VARCHAR(255),
  title JSONB NOT NULL,
  description JSONB,
  short_description TEXT,
  category VARCHAR(100),
  level VARCHAR(50),
  language VARCHAR(10),
  price DECIMAL(10,2) DEFAULT 0,
  thumbnail TEXT,
  duration VARCHAR(50),
  students INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  course_id VARCHAR(255) REFERENCES courses(id),
  progress INTEGER DEFAULT 0,
  completed_videos TEXT[] DEFAULT '{}',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id VARCHAR(255) PRIMARY KEY,
  enrollment_id VARCHAR(255) REFERENCES enrollments(id),
  video_id VARCHAR(255) NOT NULL,
  watched BOOLEAN DEFAULT false,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(enrollment_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_enrollment_id ON progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_progress_video_id ON progress(video_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  course_id VARCHAR(255) REFERENCES courses(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Q&A table
CREATE TABLE IF NOT EXISTS qa (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  course_id VARCHAR(255) REFERENCES courses(id),
  question TEXT NOT NULL,
  answers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_course_id ON qa(course_id);
CREATE INDEX IF NOT EXISTS idx_qa_user_id ON qa(user_id);

-- Discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  course_id VARCHAR(255) REFERENCES courses(id),
  title VARCHAR(500),
  content TEXT NOT NULL,
  replies JSONB DEFAULT '[]'::jsonb,
  likes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);

-- Course Submissions table
CREATE TABLE IF NOT EXISTS course_submissions (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) REFERENCES courses(id),
  instructor_id VARCHAR(255) REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'submitted_for_review',
  admin_comments JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_instructor_id ON course_submissions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_course_id ON course_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON course_submissions(status);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) REFERENCES courses(id),
  lesson_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit INTEGER,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) REFERENCES courses(id),
  instructor_id VARCHAR(255) REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMP,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_instructor_id ON announcements(instructor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON announcements(is_published);

-- Course Status History table
CREATE TABLE IF NOT EXISTS course_status_history (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) REFERENCES courses(id),
  status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255) REFERENCES users(id),
  changed_by_role VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_course_id ON course_status_history(course_id);
CREATE INDEX IF NOT EXISTS idx_status_history_status ON course_status_history(status);

-- Insert test users (TODO: REMOVE BEFORE PRODUCTION)
-- Password is base64 encoded '1122334455'
INSERT INTO users (id, email, password, name, role) VALUES
  ('test-admin-001', 'admin@admin.com', 'MTEyMjMzNDQ1NQ==', 'Test Admin', 'admin'),
  ('test-instructor-001', 'ins@ins.com', 'MTEyMjMzNDQ1NQ==', 'Test Instructor', 'instructor')
ON CONFLICT (email) DO NOTHING;
