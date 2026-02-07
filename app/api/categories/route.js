import { NextResponse } from 'next/server'

// Mock categories (replace with DB when you have a categories table)
const MOCK_CATEGORIES = [
  {
    id: 'prompt-engineering',
    title: { en: 'Prompt Engineering', ar: 'هندسة التلميحات' },
    slug: 'prompt-engineering',
    imageUrl: 'https://picsum.photos/seed/pe/600/340',
    shortDescription: { en: 'Master prompts for ChatGPT and AI tools', ar: 'أتقن التلميحات لـ ChatGPT وأدوات الذكاء الاصطناعي' },
    order: 1,
    isFeatured: true,
  },
  {
    id: 'chatgpt',
    title: { en: 'ChatGPT', ar: 'شات جي بي تي' },
    slug: 'chatgpt',
    imageUrl: 'https://picsum.photos/seed/cgpt/600/340',
    shortDescription: { en: 'Use ChatGPT effectively in work and life', ar: 'استخدم ChatGPT بفعالية في العمل والحياة' },
    order: 2,
    isFeatured: true,
  },
  {
    id: 'data-science',
    title: { en: 'Data Science', ar: 'علوم البيانات' },
    slug: 'data-science',
    imageUrl: 'https://picsum.photos/seed/ds/600/340',
    shortDescription: { en: 'From analysis to machine learning', ar: 'من التحليل إلى التعلّم الآلي' },
    order: 3,
    isFeatured: true,
  },
  {
    id: 'machine-learning',
    title: { en: 'Machine Learning', ar: 'التعلّم الآلي' },
    slug: 'machine-learning',
    imageUrl: 'https://picsum.photos/seed/ml/600/340',
    shortDescription: { en: 'Build and deploy ML models', ar: 'بناء ونشر نماذج التعلّم الآلي' },
    order: 4,
    isFeatured: true,
  },
  {
    id: 'python',
    title: { en: 'Python', ar: 'بايثون' },
    slug: 'python',
    imageUrl: 'https://picsum.photos/seed/py/600/340',
    shortDescription: { en: 'Programming for data and AI', ar: 'البرمجة للبيانات والذكاء الاصطناعي' },
    order: 5,
    isFeatured: true,
  },
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const featuredOnly = searchParams.get('featured') === 'true'

    let list = [...MOCK_CATEGORIES].sort((a, b) => a.order - b.order)
    if (featuredOnly) list = list.filter((c) => c.isFeatured)

    return NextResponse.json({ categories: list })
  } catch (err) {
    return NextResponse.json({ categories: [] }, { status: 200 })
  }
}
