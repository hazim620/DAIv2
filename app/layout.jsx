import './globals.css'
import { Cairo } from 'next/font/google'
import { LanguageProvider } from '@/contexts/language-context'
import { AuthProvider } from '@/contexts/auth-context'
import { SearchProvider } from '@/contexts/search-context'
import { ThemeProvider } from '@/contexts/theme-context'

const cairo = Cairo({ subsets: ['latin', 'arabic'], variable: '--font-cairo' })

export const metadata = {
  title: 'DAi - Data & AI Learning Platform',
  description: 'Learn Data Science and AI with expert instructors',
  icons: { icon: '/logo.png' },
}

export default function Layout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cairo.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('dai-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='dark'||s==='light'?s:(d?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');})();`,
          }}
        />
      </head>
      <body className={`${cairo.className} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <SearchProvider>
                {children}
              </SearchProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
