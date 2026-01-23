import './globals.css'
import { LanguageProvider } from '@/contexts/language-context'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata = {
  title: 'DAI - Data & AI Learning Platform',
  description: 'Learn Data Science and AI with expert instructors',
}

export default function Layout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
