# DAI Platform - Data & AI Learning Platform

A comprehensive, full-stack learning management system (LMS) built with Next.js 14, featuring course management, video playback, user authentication, progress tracking, and bilingual support (English/Arabic).

## Features

### 🎓 Core Features
- **User Authentication**: Secure signup, login, and logout with JWT tokens
- **Course Management**: Browse, search, and enroll in courses
- **Video Player**: Watch course videos with progress tracking
- **User Dashboard**: Track enrolled courses and learning progress
- **Progress Tracking**: Automatic progress updates as you watch videos
- **Bilingual Support**: Full English and Arabic language support with RTL layout
- **Admin Panel**: Manage courses and content (admin role required)

### 🛠️ Technical Features
- **Next.js 14** with App Router
- **React 18** with Client Components
- **JSON-based Database** (easily replaceable with MongoDB, PostgreSQL, etc.)
- **JWT Authentication** with HTTP-only cookies
- **Responsive Design** with Tailwind CSS
- **UI Components** using Radix UI and shadcn/ui
- **Type-safe** utilities with TypeScript-ready structure

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hazim620/DAIv2.git
   cd DAIv2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create data directory**
   The data directory will be created automatically on first run, but you can create it manually:
   ```bash
   mkdir data
   ```

4. **Set up environment variables** (optional)
   Create a `.env.local` file:
   ```env
   JWT_SECRET=your-secret-key-here-change-in-production
   NODE_ENV=development
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
DAIv2/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── courses/       # Course endpoints
│   │   ├── enrollments/   # Enrollment endpoints
│   │   └── progress/       # Progress tracking
│   ├── courses/           # Course pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── profile/           # User profile
│   └── admin/             # Admin panel
├── components/            # React components
│   ├── ui/                # UI components (shadcn/ui)
│   └── ...                # Other components
├── contexts/              # React contexts
│   ├── auth-context.jsx   # Authentication context
│   └── language-context.jsx # Language/i18n context
├── lib/                   # Utility libraries
│   ├── auth.js            # Authentication utilities
│   ├── db.js              # Database layer
│   ├── i18n.js            # Internationalization
│   └── utils.js           # General utilities
├── data/                  # JSON database (gitignored)
└── public/                # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/[id]` - Get course by ID
- `POST /api/courses` - Create course (admin only)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in a course

### Progress
- `GET /api/progress?enrollmentId=...` - Get progress for enrollment
- `POST /api/progress` - Update video progress

## Database

The platform uses a JSON-based file system for data storage. All data is stored in the `/data` directory:
- `users.json` - User accounts
- `courses.json` - Course data
- `enrollments.json` - Course enrollments
- `progress.json` - Video watch progress

**Note**: This is designed for development and can be easily replaced with a real database (MongoDB, PostgreSQL, etc.) by updating the `lib/db.js` file.

## User Roles

- **Student** (default): Can browse courses, enroll, and watch videos
- **Admin**: Can create, edit, and delete courses

To create an admin user, manually edit `data/users.json` and set `role: "admin"` for a user.

## Features in Detail

### Authentication Flow
1. User signs up or logs in
2. JWT token is generated and stored in HTTP-only cookie
3. Token is verified on protected routes
4. User data is available via AuthContext

### Course Enrollment
1. User browses courses
2. Clicks "Enroll Now" on a course
3. Enrollment is created (payment processing can be added)
4. User gains access to all course videos

### Progress Tracking
1. As user watches videos, progress is saved
2. Progress percentage is calculated based on watched videos
3. Completed videos are marked with checkmarks
4. Dashboard shows overall progress

### Video Player
1. Navigate to course detail page
2. Click on a video to watch
3. Progress is automatically saved
4. Next/Previous navigation between videos
5. Course content sidebar shows all videos

## Customization

### Adding a Real Database
Replace the functions in `lib/db.js` with your database calls. The interface remains the same, so no other code changes are needed.

### Adding Payment Processing
Integrate Stripe, PayPal, or another payment provider in the enrollment API endpoint (`app/api/enrollments/route.js`).

### Adding More Languages
1. Add translations to `lib/i18n.js`
2. Update language switcher component
3. Ensure RTL support for RTL languages

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
The platform is a standard Next.js app and can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

**Important**: For production, make sure to:
- Set a strong `JWT_SECRET` environment variable
- Use a real database instead of JSON files
- Enable HTTPS
- Set up proper error logging
- Configure CORS if needed

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For support, email hazimalzahrani9@gmail.com or open an issue on GitHub.

---

Built with ❤️ using Next.js and React
