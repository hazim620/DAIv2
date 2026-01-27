# API Routes Update Required

All database functions in `lib/db.js` are now **async** and must be called with `await`.

## Quick Fix Pattern

**Before:**
```javascript
const user = usersDB.getByEmail(email)
const courses = coursesDB.getAll()
const course = coursesDB.create(data)
```

**After:**
```javascript
const user = await usersDB.getByEmail(email)
const courses = await coursesDB.getAll()
const course = await coursesDB.create(data)
```

## Files That Need Updates

### ✅ Already Updated:
- `app/api/auth/login/route.js`
- `app/api/auth/signup/route.js`
- `app/api/auth/me/route.js`
- `app/api/courses/route.js`
- `app/api/courses/[id]/route.js`
- `app/api/enrollments/route.js`

### ⚠️ Still Need Updates:

1. **`app/api/progress/route.js`**
   - `enrollmentsDB.getAll()` → `await enrollmentsDB.getAll()`
   - `progressDB.updateVideoProgress()` → `await progressDB.updateVideoProgress()`
   - `progressDB.getByEnrollment()` → `await progressDB.getByEnrollment()`
   - `enrollmentsDB.update()` → `await enrollmentsDB.update()`

2. **`app/api/reviews/route.js`**
   - `reviewsDB.getAll()` → `await reviewsDB.getAll()`
   - `reviewsDB.getByCourseId()` → `await reviewsDB.getByCourseId()`
   - `usersDB.getAll()` → `await usersDB.getAll()`
   - `reviewsDB.getByUserAndCourse()` → `await reviewsDB.getByUserAndCourse()`
   - `reviewsDB.create()` → `await reviewsDB.create()`

3. **`app/api/qa/route.js`**
   - `qaDB.getByCourseId()` → `await qaDB.getByCourseId()`
   - `usersDB.getAll()` → `await usersDB.getAll()`
   - `qaDB.addAnswer()` → `await qaDB.addAnswer()`
   - `qaDB.create()` → `await qaDB.create()`

4. **`app/api/discussions/route.js`**
   - `discussionsDB.getByCourseId()` → `await discussionsDB.getByCourseId()`
   - `usersDB.getAll()` → `await usersDB.getAll()`
   - `discussionsDB.addReply()` → `await discussionsDB.addReply()`
   - `discussionsDB.create()` → `await discussionsDB.create()`

5. **`app/api/instructor/dashboard/route.js`**
   - `coursesDB.getByInstructorId()` → `await coursesDB.getByInstructorId()`
   - `enrollmentsDB.getByCourseId()` → `await enrollmentsDB.getByCourseId()`
   - `courseSubmissionsDB.getByInstructorId()` → `await courseSubmissionsDB.getByInstructorId()`

6. **`app/api/instructor/courses/route.js`**
   - `coursesDB.getByInstructorId()` → `await coursesDB.getByInstructorId()`
   - `coursesDB.create()` → `await coursesDB.create()`
   - `courseStatusHistoryDB.create()` → `await courseStatusHistoryDB.create()`

7. **`app/api/instructor/courses/[id]/route.js`**
   - `coursesDB.getById()` → `await coursesDB.getById()`
   - `courseStatusHistoryDB.getByCourseId()` → `await courseStatusHistoryDB.getByCourseId()`
   - `coursesDB.update()` → `await coursesDB.update()`
   - `coursesDB.delete()` → `await coursesDB.delete()`

8. **`app/api/instructor/submissions/route.js`**
   - `courseSubmissionsDB.getByInstructorId()` → `await courseSubmissionsDB.getByInstructorId()`
   - `coursesDB.getById()` → `await coursesDB.getById()`
   - `courseSubmissionsDB.create()` → `await courseSubmissionsDB.create()`
   - `coursesDB.update()` → `await coursesDB.update()`
   - `courseStatusHistoryDB.create()` → `await courseStatusHistoryDB.create()`

9. **`app/api/instructor/submissions/[id]/route.js`**
   - `courseSubmissionsDB.getAll()` → `await courseSubmissionsDB.getAll()`
   - `coursesDB.getById()` → `await coursesDB.getById()`
   - `courseSubmissionsDB.update()` → `await courseSubmissionsDB.update()`

10. **`app/api/instructor/students/route.js`**
    - `coursesDB.getByInstructorId()` → `await coursesDB.getByInstructorId()`
    - `coursesDB.getById()` → `await coursesDB.getById()`
    - `enrollmentsDB.getByCourseId()` → `await enrollmentsDB.getByCourseId()`
    - `usersDB.getById()` → `await usersDB.getById()`
    - `progressDB.getByEnrollment()` → `await progressDB.getByEnrollment()`

11. **`app/api/instructor/announcements/route.js`**
    - `announcementsDB.getByInstructorId()` → `await announcementsDB.getByInstructorId()`
    - `coursesDB.getById()` → `await coursesDB.getById()`
    - `announcementsDB.create()` → `await announcementsDB.create()`

12. **`app/api/instructor/quizzes/route.js`**
    - `coursesDB.getByInstructorId()` → `await coursesDB.getByInstructorId()`
    - `quizzesDB.getAll()` → `await quizzesDB.getAll()`
    - `coursesDB.getById()` → `await coursesDB.getById()`
    - `quizzesDB.create()` → `await quizzesDB.create()`

## Search & Replace Commands

You can use these patterns to find and replace:

**Find:** `(usersDB|coursesDB|enrollmentsDB|progressDB|reviewsDB|qaDB|discussionsDB|courseSubmissionsDB|quizzesDB|announcementsDB|courseStatusHistoryDB)\.(get|create|update|delete|add)(\w+)\(`

**Replace with:** `await $1.$2$3(`

**Note:** Be careful with this automated approach - review each change manually to ensure correctness.

## Testing

After updating all routes:

1. Test login: `POST /api/auth/login`
2. Test course listing: `GET /api/courses`
3. Test enrollment: `POST /api/enrollments`
4. Test instructor dashboard: `GET /api/instructor/dashboard`

All routes should work with PostgreSQL now!
