-- Migration: Add instructor registration, email verification, and enhanced features
-- Run this after the initial schema.sql

-- Add columns to users table for instructor registration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS country_of_residence VARCHAR(100),
ADD COLUMN IF NOT EXISTS education_level VARCHAR(100),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS university_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS major VARCHAR(255),
ADD COLUMN IF NOT EXISTS readiness_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS expected_students_per_term INTEGER,
ADD COLUMN IF NOT EXISTS how_did_you_hear VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'email_not_verified',
ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);

-- Add course versioning to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_course_id VARCHAR(255) REFERENCES courses(id),
ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_courses_version ON courses(version);
CREATE INDEX IF NOT EXISTS idx_courses_parent_id ON courses(parent_course_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'system', 'course', 'financial', 'admin_comment', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create course_drafts table for auto-save
CREATE TABLE IF NOT EXISTS course_drafts (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_drafts_instructor_id ON course_drafts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_drafts_course_id ON course_drafts(course_id);

-- Update existing test users to have verified email and approved status
UPDATE users 
SET email_verified = true, 
    account_status = 'approved'
WHERE email IN ('admin@admin.com', 'ins@ins.com') 
  AND (email_verified IS NULL OR email_verified = false);
