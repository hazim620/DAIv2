# PostgreSQL Database Setup Guide

This guide will help you connect your DAIv2 application to PostgreSQL on AWS RDS.

## Prerequisites

- AWS RDS PostgreSQL instance running
- Database credentials:
  - Endpoint: `dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com`
  - Username: `postgres`
  - Password: `postgres`
  - Database: `postgres`

## Step 1: Install Dependencies

```bash
npm install
```

This will install `pg` (PostgreSQL client) and `dotenv` (for environment variables).

## Step 2: Configure Environment Variables

### For Local Development

Create a `.env` file in the root directory:

```env
DB_HOST=dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
```

### For AWS Amplify

1. Go to AWS Amplify Console
2. Select your app
3. Navigate to **App Settings** → **Environment variables**
4. Add the following variables:

```
DB_HOST=dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
```

## Step 3: Configure RDS Security Group

**IMPORTANT**: Your RDS instance must allow connections from Amplify.

1. Go to AWS RDS Console
2. Select your database instance
3. Click on **Connectivity & security** tab
4. Click on the **VPC security group** link
5. In the Security Group rules, add an **Inbound rule**:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your Amplify app's security group OR `0.0.0.0/0` (for testing, restrict in production)

## Step 4: Run Database Migration

Run the migration script to create all tables:

```bash
npm run migrate
```

This will:
- Create all database tables (users, courses, enrollments, etc.)
- Create indexes for performance
- Insert test users (admin@admin.com and ins@ins.com with password: 1122334455)

## Step 5: Update API Routes

All API routes need to be updated to use `await` when calling database functions since they're now async.

**Example:**

**Before:**
```javascript
const user = usersDB.getByEmail(email)
```

**After:**
```javascript
const user = await usersDB.getByEmail(email)
```

### Files that need updating:

- `app/api/auth/login/route.js`
- `app/api/auth/signup/route.js`
- `app/api/auth/me/route.js`
- `app/api/courses/route.js`
- `app/api/courses/[id]/route.js`
- `app/api/enrollments/route.js`
- `app/api/progress/route.js`
- `app/api/reviews/route.js`
- `app/api/qa/route.js`
- `app/api/discussions/route.js`
- `app/api/instructor/dashboard/route.js`
- `app/api/instructor/courses/route.js`
- `app/api/instructor/courses/[id]/route.js`
- `app/api/instructor/submissions/route.js`
- `app/api/instructor/submissions/[id]/route.js`
- `app/api/instructor/students/route.js`
- `app/api/instructor/announcements/route.js`
- `app/api/instructor/quizzes/route.js`

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try logging in with test credentials:
   - Email: `admin@admin.com`
   - Password: `1122334455`

## Troubleshooting

### Connection Timeout

- Check RDS security group allows connections from your IP/Amplify
- Verify database endpoint is correct
- Check if database is publicly accessible (if connecting from local)

### Migration Errors

- Ensure you have proper permissions on the database
- Check that the database exists
- Verify connection credentials

### API Errors

- Make sure all API routes use `await` for database calls
- Check browser console and server logs for errors
- Verify environment variables are set correctly

## Production Checklist

Before deploying to production:

- [ ] Change default database password
- [ ] Remove test users (admin@admin.com, ins@ins.com)
- [ ] Set strong JWT_SECRET
- [ ] Restrict RDS security group to only allow Amplify IPs
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Review and optimize database indexes
- [ ] Set up connection pooling limits

## Database Schema

The migration creates the following tables:

- `users` - User accounts (students, instructors, admins)
- `courses` - Course information
- `enrollments` - Student course enrollments
- `progress` - Video watching progress
- `reviews` - Course reviews and ratings
- `qa` - Q&A questions and answers
- `discussions` - Course discussions
- `course_submissions` - Course submission workflow
- `quizzes` - Course quizzes
- `announcements` - Course announcements
- `course_status_history` - Audit trail for course status changes

## Support

If you encounter issues, check:
1. AWS RDS console for database status
2. CloudWatch logs for connection errors
3. Application logs for query errors
