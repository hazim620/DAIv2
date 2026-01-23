'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTranslation } from '@/lib/i18n'
import { useState, useEffect } from 'react'
import { BookOpen, Users, Award, PlayCircle } from 'lucide-react'

export default function Home() {
  const [locale, setLocale] = useState('en')
  const t = (key) => getTranslation(locale, key)

  useEffect(() => {
    setLocale(localStorage.getItem('locale') || 'en')
  }, [])

  const features = [
    {
      icon: BookOpen,
      title: locale === 'ar' ? 'دورات شاملة' : 'Comprehensive Courses',
      description: locale === 'ar' 
        ? 'تعلم من أفضل المدربين في مجال البيانات والذكاء الاصطناعي'
        : 'Learn from the best instructors in data science and AI',
    },
    {
      icon: Users,
      title: locale === 'ar' ? 'مجتمع نشط' : 'Active Community',
      description: locale === 'ar'
        ? 'انضم إلى مجتمع من المتعلمين المتحمسين'
        : 'Join a community of passionate learners',
    },
    {
      icon: Award,
      title: locale === 'ar' ? 'شهادات معتمدة' : 'Certified Certificates',
      description: locale === 'ar'
        ? 'احصل على شهادات معتمدة عند إكمال الدورات'
        : 'Get certified certificates upon course completion',
    },
    {
      icon: PlayCircle,
      title: locale === 'ar' ? 'فيديوهات عالية الجودة' : 'High Quality Videos',
      description: locale === 'ar'
        ? 'شاهد فيديوهات عالية الجودة من مدربين محترفين'
        : 'Watch high-quality videos from professional instructors',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-br from-primary/10 via-white to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  {t('getStarted')}
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  {t('exploreCourses')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {locale === 'ar' ? 'ابدأ رحلتك التعليمية اليوم' : 'Start Your Learning Journey Today'}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {locale === 'ar' 
              ? 'انضم إلى آلاف الطلاب الذين يتعلمون معنا'
              : 'Join thousands of students learning with us'}
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              {t('getStarted')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">DAI</h3>
              <p className="text-gray-400">
                {locale === 'ar'
                  ? 'منصة تعليمية متخصصة في علوم البيانات والذكاء الاصطناعي'
                  : 'Educational platform specialized in data science and AI'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('courses')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{locale === 'ar' ? 'جميع الدورات' : 'All Courses'}</li>
                <li>{locale === 'ar' ? 'دورات مجانية' : 'Free Courses'}</li>
                <li>{locale === 'ar' ? 'دورات مدفوعة' : 'Paid Courses'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('about')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{locale === 'ar' ? 'من نحن' : 'About Us'}</li>
                <li>{locale === 'ar' ? 'فريق العمل' : 'Our Team'}</li>
                <li>{locale === 'ar' ? 'الشراكات' : 'Partnerships'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('contact')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{locale === 'ar' ? 'اتصل بنا' : 'Contact Us'}</li>
                <li>{locale === 'ar' ? 'الدعم الفني' : 'Support'}</li>
                <li>{locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 DAI Platform. {locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
