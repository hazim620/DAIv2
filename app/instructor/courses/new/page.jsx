'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { 
  ArrowLeft, Save, Plus, Trash2, Eye, Upload, FileText, 
  Video, FileQuestion, CheckCircle, AlertCircle, XCircle,
  File, BookOpen, ChevronRight, ChevronLeft, Play, GripVertical, Lock, Clock,
  Bold, Italic, Underline, List, ListOrdered
} from 'lucide-react'
import Link from 'next/link'
import { uploadToS3Direct } from '@/lib/aws/browser-s3-upload.js'

function ArticleRichEditor({ articleId, sectionId, content, locale, updateContent }) {
  const editorRef = useRef(null)
  const lastContentRef = useRef(content)
  useEffect(() => {
    if (!editorRef.current) return
    if (lastContentRef.current === content && editorRef.current.innerHTML) return
    lastContentRef.current = content
    editorRef.current.innerHTML = content || ''
  }, [articleId, content])

  const syncContent = useCallback(() => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    if (html === lastContentRef.current) return
    lastContentRef.current = html
    updateContent(sectionId, articleId, 'article', { content: html })
  }, [sectionId, articleId, updateContent])

  return (
    <div
      ref={editorRef}
      id={`article-editor-${articleId}`}
      contentEditable
      suppressContentEditableWarning
      className="w-full min-h-[120px] px-3 py-2 border rounded-b-md rounded-t-none focus:outline-none focus:ring-2 focus:ring-primary/20"
      style={{ fontSize: '16px' }}
      data-placeholder={locale === 'ar' ? 'محتوى المقال...' : 'Article content...'}
      onBlur={syncContent}
      onInput={syncContent}
    />
  )
}

export default function NewCoursePage({ initialCourseId = null, initialFormData = null, initialStep = 1 }) {
  const router = useRouter()
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [courseId, setCourseId] = useState(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [expandedSectionId, setExpandedSectionId] = useState(null)
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'general',
    level: 'beginner',
    language: 'en',
    price: 0,
    thumbnail: '',
    sections: [],
  })
  const [validationErrors, setValidationErrors] = useState([])
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      router.replace('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (initializedRef.current) return
    if (!initialCourseId && !initialFormData) return

    initializedRef.current = true
    if (initialCourseId) setCourseId(initialCourseId)
    if (initialFormData) {
      setFormData(prev => ({
        ...prev,
        ...initialFormData,
        sections: Array.isArray(initialFormData.sections) ? initialFormData.sections : prev.sections,
      }))
    }
  }, [initialCourseId, initialFormData])

  const totalSteps = 3

  const uploadToS3 = async ({ kind, fileOrBlob, filename, contentType, courseId: cid, sectionId }) => {
    // Direct browser -> S3 upload (no Lambda, no server presign).
    // Requires Cognito Identity Pool env vars (NEXT_PUBLIC_*) to be set.
    return await uploadToS3Direct({
      kind,
      fileOrBlob,
      filename,
      contentType,
      courseId: cid || null,
      sectionId: sectionId || null,
    })
  }

  const dataUrlToBlob = (dataUrl) => {
    const [meta, b64] = String(dataUrl).split(',')
    const mime = (meta.match(/data:([^;]+);base64/i) || [])[1] || 'application/octet-stream'
    const binary = atob(b64 || '')
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return { blob: new Blob([bytes], { type: mime }), mime }
  }

  const contentKey = (type) => {
    if (type === 'quiz') return 'quizzes'
    if (type === 'video') return 'videos'
    if (type === 'article') return 'articles'
    if (type === 'pdf') return 'pdfs'
    return `${type}s`
  }

  const normalizeQuestionType = (type) => {
    if (type === 'multiple_choice') return 'single_choice' // backwards-compat
    if (!type) return 'single_choice'
    return type
  }

  // Get all contents from a section in order (shared function)
  const getAllContents = (section) => {
    const contents = []
    let orderIndex = 0
    
    // Combine all content types and assign order if missing
    const videos = (section.videos || []).map((v, idx) => ({ 
      ...v, 
      type: 'video', 
      order: v.order !== undefined ? v.order : orderIndex++ 
    }))
    const quizzes = (section.quizzes || []).map((q, idx) => {
      // Ensure type is always set to 'quiz'
      const quizOrder = q.order !== undefined ? q.order : orderIndex++
      orderIndex = Math.max(orderIndex, quizOrder + 1)
      return {
        ...q,
        id: q.id || `quiz-${Date.now()}-${idx}`, // Ensure ID exists
        type: 'quiz', // Always ensure type is 'quiz'
        order: quizOrder,
        questions: Array.isArray(q.questions) ? q.questions : [], // Ensure questions array is always initialized
        passingScore: q.passingScore !== undefined ? q.passingScore : 70,
        maxAttempts: q.maxAttempts !== undefined ? q.maxAttempts : 3,
        title: q.title || { en: 'New Quiz', ar: 'اختبار جديد' }
      }
    })
    const articles = (section.articles || []).map((a, idx) => ({ 
      ...a, 
      type: 'article', 
      order: a.order !== undefined ? a.order : orderIndex++ 
    }))
    const pdfs = (section.pdfs || []).map((p, idx) => ({ 
      ...p, 
      type: 'pdf', 
      order: p.order !== undefined ? p.order : orderIndex++ 
    }))
    
    contents.push(...videos, ...quizzes, ...articles, ...pdfs)
    return contents.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // Compress and resize image before converting to base64
  const compressImage = (file, callback) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(locale === 'ar' ? 'حجم الصورة كبير جداً. الحد الأقصى 5MB' : 'Image size too large. Maximum 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas to resize and compress
        const canvas = document.createElement('canvas')
        const maxWidth = 800
        const maxHeight = 600
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64 with compression (quality 0.8)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
        
        // Check if compressed size is reasonable (max 500KB base64 = ~375KB actual)
        if (compressedBase64.length > 500000) {
          // Try with lower quality
          const lowerQuality = canvas.toDataURL('image/jpeg', 0.6)
          if (lowerQuality.length > 500000) {
            // Try even lower quality
            const veryLowQuality = canvas.toDataURL('image/jpeg', 0.4)
            if (veryLowQuality.length > 500000) {
              alert(locale === 'ar' ? 'الصورة كبيرة جداً حتى بعد الضغط. يرجى اختيار صورة أصغر' : 'Image too large even after compression. Please choose a smaller image')
              return
            }
            callback(veryLowQuality)
          } else {
            callback(lowerQuality)
          }
        } else {
          callback(compressedBase64)
        }
      }
      img.onerror = () => {
        alert(locale === 'ar' ? 'خطأ في تحميل الصورة' : 'Error loading image')
      }
      img.src = e.target.result
    }
    reader.onerror = () => {
      alert(locale === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file')
    }
    reader.readAsDataURL(file)
  }

  // Step 1: Basic Information
  const Step1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">
          {locale === 'ar' ? 'عنوان الدورة *' : 'Course Title *'}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          placeholder={locale === 'ar' ? 'أدخل عنوان الدورة' : 'Enter course title'}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="shortDescription">
          {locale === 'ar' ? 'الوصف القصير' : 'Short Description'}
        </Label>
        <Input
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
          placeholder={locale === 'ar' ? 'وصف مختصر للدورة' : 'Brief course description'}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">
          {locale === 'ar' ? 'الوصف الكامل *' : 'Full Description *'}
        </Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
          placeholder={locale === 'ar' ? 'وصف مفصل للدورة' : 'Detailed course description'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">
            {locale === 'ar' ? 'الفئة' : 'Category'}
          </Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
          >
            <option value="general">General</option>
            <option value="data-science">Data Science</option>
            <option value="ai">AI</option>
            <option value="programming">Programming</option>
            <option value="business">Business</option>
            <option value="design">Design</option>
          </select>
        </div>

        <div>
          <Label htmlFor="level">
            {locale === 'ar' ? 'المستوى' : 'Level'}
          </Label>
          <select
            id="level"
            value={formData.level}
            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
          >
            <option value="beginner">{locale === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
            <option value="intermediate">{locale === 'ar' ? 'متوسط' : 'Intermediate'}</option>
            <option value="advanced">{locale === 'ar' ? 'متقدم' : 'Advanced'}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">
            {locale === 'ar' ? 'السعر' : 'Price'} ($)
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="language">
            {locale === 'ar' ? 'اللغة' : 'Language'}
          </Label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="thumbnail-file-input">
          {locale === 'ar' ? 'صورة الدورة *' : 'Course Thumbnail *'}
        </Label>
        <div className="mt-1">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.classList.add('border-primary', 'bg-primary/5')
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
              const file = e.dataTransfer.files[0]
              if (file && file.type.startsWith('image/')) {
                setUploadingThumbnail(true)
                compressImage(file, async (compressedDataUrl) => {
                  try {
                    const { blob, mime } = dataUrlToBlob(compressedDataUrl)
                    const { key, publicUrl } = await uploadToS3({
                      kind: 'thumbnail',
                      fileOrBlob: blob,
                      filename: file.name || 'thumbnail.jpg',
                      contentType: mime || 'image/jpeg',
                      courseId,
                    })
                    setFormData(prev => ({ ...prev, thumbnail: publicUrl, thumbnailKey: key }))
                  } catch (err) {
                    console.error('Thumbnail upload error:', err)
                    alert(locale === 'ar' ? 'فشل رفع الصورة' : 'Thumbnail upload failed')
                  } finally {
                    setUploadingThumbnail(false)
                  }
                })
              }
            }}
            onClick={() => document.getElementById('thumbnail-file-input')?.click()}
          >
            {formData.thumbnail ? (
              <div className="space-y-2">
                <img src={formData.thumbnail} alt="Thumbnail" className="max-h-48 mx-auto rounded" />
                {uploadingThumbnail && (
                  <p className="text-sm text-gray-600">
                    {locale === 'ar' ? 'جاري رفع الصورة...' : 'Uploading thumbnail...'}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {locale === 'ar' ? 'انقر لتغيير الصورة' : 'Click to change image'}
                </p>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {locale === 'ar' ? 'اسحب وأفلت الصورة هنا أو انقر للرفع' : 'Drag and drop image here or click to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === 'ar' ? 'PNG, JPG, GIF حتى 5MB' : 'PNG, JPG, GIF up to 5MB'}
                </p>
                {uploadingThumbnail && (
                  <p className="text-sm text-gray-600 mt-2">
                    {locale === 'ar' ? 'جاري رفع الصورة...' : 'Uploading thumbnail...'}
                  </p>
                )}
              </div>
            )}
            <input
              id="thumbnail-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setUploadingThumbnail(true)
                  compressImage(file, async (compressedDataUrl) => {
                    try {
                      const { blob, mime } = dataUrlToBlob(compressedDataUrl)
                      const { key, publicUrl } = await uploadToS3({
                        kind: 'thumbnail',
                        fileOrBlob: blob,
                        filename: file.name || 'thumbnail.jpg',
                        contentType: mime || 'image/jpeg',
                        courseId,
                      })
                      setFormData(prev => ({ ...prev, thumbnail: publicUrl, thumbnailKey: key }))
                    } catch (err) {
                      console.error('Thumbnail upload error:', err)
                      alert(locale === 'ar' ? 'فشل رفع الصورة' : 'Thumbnail upload failed')
                    } finally {
                      setUploadingThumbnail(false)
                    }
                  })
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Step 2: Add Sections
  const Step2 = () => {
    const addSection = () => {
      setFormData(prev => ({
        ...prev,
        sections: [
          ...prev.sections,
          {
            id: Date.now().toString(),
            title: { en: 'New Section', ar: 'قسم جديد' },
            videos: [],
            quizzes: [],
            articles: [],
            pdfs: [],
            isFreePreview: false,
          },
        ],
      }))
    }

  const updateSection = (sectionId, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }))
  }

    const deleteSection = (sectionId) => {
      if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this section?')) {
        setFormData(prev => ({
          ...prev,
          sections: prev.sections.filter(s => s.id !== sectionId),
        }))
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {locale === 'ar' ? 'أقسام الدورة' : 'Course Sections'}
          </h3>
          <Button onClick={addSection} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {locale === 'ar' ? 'إضافة قسم' : 'Add Section'}
          </Button>
        </div>

        {formData.sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {locale === 'ar' ? 'لا توجد أقسام. أضف قسمك الأول' : 'No sections. Add your first section'}
              </p>
              <Button onClick={addSection}>
                <Plus className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'إضافة قسم' : 'Add Section'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {formData.sections.map((section, sIdx) => (
              <Card key={section.id} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Input
                          value={typeof section.title === 'object' ? (section.title[locale] || section.title.en || '') : (section.title || '')}
                          onChange={(e) => {
                            const currentTitle = typeof section.title === 'object' ? section.title : { en: section.title || '', ar: section.title || '' }
                            const newTitle = { ...currentTitle }
                            newTitle[locale] = e.target.value
                            updateSection(section.id, { title: newTitle })
                          }}
                          placeholder={locale === 'ar' ? 'عنوان القسم' : 'Section title'}
                          className="text-lg font-semibold"
                        />
                      </div>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={section.isFreePreview || false}
                          onChange={(e) => updateSection(section.id, { isFreePreview: e.target.checked })}
                        />
                        {locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    {locale === 'ar' ? 'سيتم إضافة المحتوى في الخطوة التالية' : 'Content will be added in the next step'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Step 2 (Builder): Sections + Content
  const Step3 = () => {
  const addSectionAt = (insertIndex) => {
    const newSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: { en: 'New Section', ar: 'قسم جديد' },
      videos: [],
      quizzes: [],
      articles: [],
      pdfs: [],
      isFreePreview: false,
    }
    setFormData(prev => {
      const nextSections = [...(prev.sections || [])]
      const idx = Math.max(0, Math.min(insertIndex, nextSections.length))
      nextSections.splice(idx, 0, newSection)
      return { ...prev, sections: nextSections }
    })
    setExpandedSectionId(newSection.id)
  }

  const updateSectionMeta = (sectionId, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s => (s.id === sectionId ? { ...s, ...updates } : s)),
    }))
  }

  const deleteSection = (sectionId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this section?')) return
    setFormData(prev => ({
      ...prev,
      sections: (prev.sections || []).filter(s => s.id !== sectionId),
    }))
    setExpandedSectionId(prev => (prev === sectionId ? null : prev))
  }

  const reorderSections = (fromIndex, toIndex) => {
    setFormData(prev => {
      const sections = [...(prev.sections || [])]
      if (fromIndex < 0 || fromIndex >= sections.length || toIndex < 0 || toIndex >= sections.length) return prev
      const [moved] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, moved)
      return { ...prev, sections }
    })
  }

  // Reorder contents within a section
  const reorderContent = (sectionId, fromIndex, toIndex) => {
    setFormData(prev => {
      const section = prev.sections.find(s => s.id === sectionId)
      if (!section) return prev

      const allContents = getAllContents(section)
      if (fromIndex < 0 || fromIndex >= allContents.length || toIndex < 0 || toIndex >= allContents.length) {
        return prev
      }

      const [moved] = allContents.splice(fromIndex, 1)
      allContents.splice(toIndex, 0, moved)

      // Update order and redistribute to type arrays
      const updatedSection = { ...section }
      updatedSection.videos = []
      updatedSection.quizzes = []
      updatedSection.articles = []
      updatedSection.pdfs = []

      allContents.forEach((content, idx) => {
        const { type, order, ...contentData } = content
        contentData.order = idx // Update order
        
        if (type === 'video') {
          updatedSection.videos.push(contentData)
        } else if (type === 'quiz') {
          // Ensure questions array is preserved
          updatedSection.quizzes.push({ ...contentData, questions: content.questions || [] })
        } else if (type === 'article') {
          updatedSection.articles.push(contentData)
        } else if (type === 'pdf') {
          updatedSection.pdfs.push(contentData)
        }
      })

      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? updatedSection : s)
      }
    })
  }

  const addContent = (sectionId, type) => {
      const section = formData.sections.find(s => s.id === sectionId)
      if (!section) {
        return
      }
      const allContents = getAllContents(section || {})
      const maxOrder = allContents.length > 0 ? Math.max(...allContents.map(c => c.order || 0)) : -1

      const newContent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: { en: `New ${type}`, ar: `${type} جديد` },
        type: type,
        order: maxOrder + 1,
      }

      if (type === 'video') {
        newContent.url = ''
        newContent.duration = 0
        newContent.status = 'pending'
        newContent.file = null
      } else if (type === 'quiz') {
        newContent.questions = []
        newContent.passingScore = 70
        newContent.maxAttempts = 3
      } else if (type === 'article') {
        newContent.content = ''
      } else if (type === 'pdf') {
        newContent.url = ''
        newContent.fileName = ''
        newContent.file = null
      }

      setFormData(prev => {
        const updatedSections = prev.sections.map(section => {
          if (section.id === sectionId) {
            const key = contentKey(type)
            const currentArray = section[key] || []
            const newItem = { ...newContent, type }
            return {
              ...section,
              [key]: [...currentArray, newItem]
            }
          }
          return section
        })
        return {
          ...prev,
          sections: updatedSections
        }
      })
    }

  const updateContent = (sectionId, contentId, type, updates) => {
    setFormData(prev => {
      return {
        ...prev,
        sections: prev.sections.map(section => {
          if (section.id === sectionId) {
            const key = contentKey(type)
            const contentArray = section[key] || []
            const updatedArray = contentArray.map(item => {
              if (item.id === contentId) {
                // For quizzes, ensure questions array is properly merged
                if (type === 'quiz') {
                  const currentQuestions = Array.isArray(item.questions) ? item.questions : []
                  const newItem = {
                    ...item,
                    ...updates,
                    questions: updates.questions !== undefined ? updates.questions : currentQuestions
                  }
                  // Ensure questions is always an array
                  if (!Array.isArray(newItem.questions)) {
                    newItem.questions = []
                  }
                  return newItem
                }
                return { ...item, ...updates }
              }
              return item
            })
            return {
              ...section,
              [key]: updatedArray
            }
          }
          return section
        }),
      }
    })
  }

    const deleteContent = (sectionId, contentId, type) => {
      setFormData(prev => ({
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                [contentKey(type)]: (section[contentKey(type)] || []).filter(item => item.id !== contentId),
              }
            : section
        ),
      }))
    }

    const handleVideoUpload = async (sectionId, contentId, file) => {
      if (!file) return

      // Validate file
      const maxSize = 500 * 1024 * 1024 // 500MB
      if (file.size > maxSize) {
        alert(locale === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 500MB)' : 'File too large (max 500MB)')
        return
      }
      if (!file.type.startsWith('video/')) {
        alert(locale === 'ar' ? 'الملف يجب أن يكون فيديو' : 'File must be a video')
        return
      }
      if (!courseId) {
        alert(locale === 'ar' ? 'يرجى حفظ معلومات الدورة أولاً (التالي) قبل رفع الفيديو' : 'Please save course basics first (Next) before uploading videos')
        return
      }

      updateContent(sectionId, contentId, 'video', {
        fileName: file.name,
        mimeType: file.type || '',
        status: 'uploading',
      })

      try {
        const { key, publicUrl } = await uploadToS3({
          kind: 'video',
          fileOrBlob: file,
          filename: file.name,
          contentType: file.type || 'video/mp4',
          courseId,
          sectionId,
        })

        updateContent(sectionId, contentId, 'video', {
          url: publicUrl,
          s3Key: key,
          fileName: file.name,
          mimeType: file.type || '',
          status: 'ready',
        })
      } catch (err) {
        console.error('Video upload error:', err)
        updateContent(sectionId, contentId, 'video', { status: 'error' })
        alert(locale === 'ar' ? 'فشل رفع الفيديو' : 'Video upload failed')
      }
    }

    const handleFileUpload = async (sectionId, contentId, file) => {
      if (!file) return

      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        alert(locale === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 100MB)' : 'File too large (max 100MB)')
        return
      }
      if (!courseId) {
        alert(locale === 'ar' ? 'يرجى حفظ معلومات الدورة أولاً (التالي) قبل رفع الملفات' : 'Please save course basics first (Next) before uploading files')
        return
      }

      updateContent(sectionId, contentId, 'pdf', {
        fileName: file.name,
        mimeType: file.type || '',
        status: 'uploading',
      })

      try {
        const { key, publicUrl } = await uploadToS3({
          kind: 'file',
          fileOrBlob: file,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          courseId,
          sectionId,
        })

        updateContent(sectionId, contentId, 'pdf', {
          url: publicUrl,
          s3Key: key,
          fileName: file.name,
          mimeType: file.type || '',
          status: 'ready',
        })
      } catch (err) {
        console.error('File upload error:', err)
        updateContent(sectionId, contentId, 'pdf', { status: 'error' })
        alert(locale === 'ar' ? 'فشل رفع الملف' : 'File upload failed')
      }
    }

    return (
      <div className="space-y-6">
        {(formData.sections || []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                {locale === 'ar' ? 'لا توجد أقسام. أضف قسمك الأول' : 'No sections. Add your first section'}
              </p>
              <button
                type="button"
                onClick={() => addSectionAt(0)}
                className="group w-full max-w-xl mx-auto border-2 border-dashed border-gray-300 rounded-lg py-6 px-4 text-center transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.01]"
              >
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <Plus className="h-5 w-5 transition-transform group-hover:scale-125" />
                  <span className="font-semibold">
                    {locale === 'ar' ? 'إضافة قسم' : 'Add Section'}
                  </span>
                </div>
              </button>
            </CardContent>
          </Card>
        ) : (
          (formData.sections || []).map((section, sIdx) => {
            const sectionTitle = typeof section.title === 'object'
              ? section.title[locale] || section.title.en
              : section.title
            const isExpanded = expandedSectionId === section.id

            return (
              <div key={section.id} className="space-y-3">
                <Card
                  className={`border-2 transition-colors ${dragOverSectionIndex === sIdx ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(sIdx))
                    e.currentTarget.classList.add('opacity-60')
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('opacity-60')
                    setDragOverSectionIndex(null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverSectionIndex(sIdx)
                  }}
                  onDragLeave={() => setDragOverSectionIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10)
                    setDragOverSectionIndex(null)
                    if (Number.isFinite(from) && from >= 0 && from !== sIdx) {
                      reorderSections(from, sIdx)
                    }
                  }}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpandedSectionId(prev => (prev === section.id ? null : section.id))}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-600">{sIdx + 1}</span>
                        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={typeof section.title === 'object' ? (section.title[locale] || section.title.en || '') : (section.title || '')}
                            onChange={(e) => {
                              const currentTitle = typeof section.title === 'object'
                                ? section.title
                                : { en: section.title || '', ar: section.title || '' }
                              const newTitle = { ...currentTitle }
                              newTitle[locale] = e.target.value
                              updateSectionMeta(section.id, { title: newTitle })
                            }}
                            placeholder={locale === 'ar' ? 'عنوان القسم' : 'Section title'}
                            className="font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={section.isFreePreview || false}
                            onChange={(e) => updateSectionMeta(section.id, { isFreePreview: e.target.checked })}
                          />
                          {locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}
                        </label>

                        <Button variant="ghost" size="sm" onClick={() => deleteSection(section.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSectionId(prev => (prev === section.id ? null : section.id))}
                          title={isExpanded ? (locale === 'ar' ? 'إخفاء' : 'Collapse') : (locale === 'ar' ? 'إظهار' : 'Expand')}
                        >
                          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4">
                  {/* Add Content Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addContent(section.id, 'video')}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {locale === 'ar' ? 'إضافة فيديو' : 'Add Video'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addContent(section.id, 'quiz')}
                    >
                      <FileQuestion className="h-4 w-4 mr-2" />
                      {locale === 'ar' ? 'إضافة اختبار' : 'Add Quiz'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addContent(section.id, 'article')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {locale === 'ar' ? 'إضافة مقال' : 'Add Article'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addContent(section.id, 'pdf')}
                    >
                      <File className="h-4 w-4 mr-2" />
                      {locale === 'ar' ? 'إضافة ملف' : 'Add File'}
                    </Button>
                  </div>

                  {/* All Contents - Combined with Drag and Drop */}
                  {getAllContents(section).length === 0 ? (
                    <Card className="bg-gray-50">
                      <CardContent className="py-8 text-center">
                        <p className="text-gray-500">
                          {locale === 'ar' ? 'لا يوجد محتوى. أضف محتوى من الأزرار أعلاه' : 'No content. Add content using the buttons above'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    getAllContents(section).map((content, contentIdx) => {
                    const contentNumber = `${sIdx + 1}.${contentIdx + 1}`
                    
                    // Video Content
                    if (content.type === 'video') {
                      const video = content
                      return (
                        <Card 
                          key={video.id} 
                          className="bg-gray-50"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', [section.id, video.id, contentIdx].join('|'))
                            e.currentTarget.classList.add('opacity-50')
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50')
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-2', 'border-blue-400')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                            const data = e.dataTransfer.getData('text/plain')
                            if (data) {
                              const parts = data.split('|')
                              if (parts.length >= 3 && parts[0] === section.id) {
                                const sourceIndex = parseInt(parts[2], 10)
                                if (!Number.isNaN(sourceIndex) && sourceIndex !== contentIdx) {
                                  reorderContent(section.id, sourceIndex, contentIdx)
                                }
                              }
                            }
                          }}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                  <span className="text-sm font-semibold text-gray-600">{contentNumber}</span>
                                  <Video className="h-5 w-5 text-blue-600" />
                                  <Input
                                    value={typeof video.title === 'object' ? (video.title[locale] || video.title.en || '') : (video.title || '')}
                                    onChange={(e) => {
                                      const currentTitle = typeof video.title === 'object' ? video.title : { en: video.title || '', ar: video.title || '' }
                                      const newTitle = { ...currentTitle }
                                      newTitle[locale] = e.target.value
                                      updateContent(section.id, video.id, 'video', { title: newTitle })
                                    }}
                                    placeholder={locale === 'ar' ? 'عنوان الفيديو *' : 'Video title *'}
                                    className="font-semibold"
                                    required
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContent(section.id, video.id, 'video')}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <Label htmlFor={`video-upload-${video.id}`} className="text-sm">
                                  {locale === 'ar' ? 'رفع فيديو' : 'Upload Video'}
                                </Label>
                                <div
                                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors mt-2"
                                  onDragOver={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                                    const data = e.dataTransfer.getData('text/plain')
                                    const parts = data ? data.split('|') : []
                                    if (parts.length >= 3 && parts[0] === section.id) {
                                      const sourceIndex = parseInt(parts[2], 10)
                                      if (!Number.isNaN(sourceIndex) && sourceIndex !== contentIdx) {
                                        reorderContent(section.id, sourceIndex, contentIdx)
                                      }
                                      return
                                    }
                                    e.stopPropagation()
                                    const file = e.dataTransfer.files[0]
                                    if (file && file.type.startsWith('video/')) {
                                      handleVideoUpload(section.id, video.id, file)
                                    }
                                  }}
                                  onClick={() => document.getElementById(`video-upload-${video.id}`)?.click()}
                                >
                                  {video.fileName || video.url ? (
                                    <div className="space-y-2">
                                      <Video className="h-8 w-8 text-blue-600 mx-auto" />
                                      <p className="text-sm font-medium">{video.fileName || 'Video uploaded'}</p>
                                      {video.status === 'uploading' && (
                                        <p className="text-sm text-blue-600">{locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</p>
                                      )}
                                      {video.status === 'ready' && (
                                        <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                                          <CheckCircle className="h-4 w-4" />
                                          {locale === 'ar' ? 'جاهز' : 'Ready'}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500">
                                        {locale === 'ar' ? 'انقر لتغيير الفيديو' : 'Click to change video'}
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-600">
                                        {locale === 'ar' ? 'اسحب وأفلت الفيديو هنا أو انقر للرفع' : 'Drag and drop video here or click to upload'}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {locale === 'ar' ? 'MP4, WebM, OGG حتى 500MB' : 'MP4, WebM, OGG up to 500MB'}
                                      </p>
                                    </div>
                                  )}
                                  <input
                                    id={`video-upload-${video.id}`}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files[0]
                                      if (file) handleVideoUpload(section.id, video.id, file)
                                    }}
                                  />
                                </div>
                                {video.url && video.url.startsWith('blob:') && (
                                  <div className="mt-2">
                                    <video src={video.url} controls className="w-full max-w-md rounded" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    // Quiz Content
                    if (content.type === 'quiz') {
                      // Get the latest quiz from formData to ensure we have current state
                      const currentSection = formData.sections.find(s => s.id === section.id)
                      const currentQuiz = currentSection?.quizzes?.find(q => q.id === content.id) || content
                      
                      // Ensure quiz has all required fields initialized
                      const quiz = { 
                        ...currentQuiz,
                        id: currentQuiz.id || content.id || `quiz-${Date.now()}`,
                        type: 'quiz',
                        title: currentQuiz.title || content.title || { en: 'New Quiz', ar: 'اختبار جديد' },
                        questions: Array.isArray(currentQuiz?.questions) 
                          ? currentQuiz.questions 
                          : (Array.isArray(content.questions) 
                            ? content.questions 
                            : []),
                        passingScore: currentQuiz?.passingScore !== undefined 
                          ? currentQuiz.passingScore 
                          : (content.passingScore !== undefined ? content.passingScore : 70),
                        maxAttempts: currentQuiz?.maxAttempts !== undefined 
                          ? currentQuiz.maxAttempts 
                          : (content.maxAttempts !== undefined ? content.maxAttempts : 3)
                      }
                      
                      // Get the latest quiz from state to ensure fresh data
                      const quizFromState = formData.sections
                        .find(s => s.id === section.id)
                        ?.quizzes?.find(q => q.id === content.id)
                      
                      const finalQuiz = quizFromState || quiz
                      
                      return (
                        <Card 
                          key={quiz.id} 
                          className="bg-gray-50"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', [section.id, finalQuiz.id, contentIdx].join('|'))
                            e.currentTarget.classList.add('opacity-50')
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50')
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-2', 'border-blue-400')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                            const data = e.dataTransfer.getData('text/plain')
                            if (data) {
                              const parts = data.split('|')
                              if (parts.length >= 3 && parts[0] === section.id) {
                                const sourceIndex = parseInt(parts[2], 10)
                                if (!Number.isNaN(sourceIndex) && sourceIndex !== contentIdx) {
                                  reorderContent(section.id, sourceIndex, contentIdx)
                                }
                              }
                            }
                          }}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                  <span className="text-sm font-semibold text-gray-600">{contentNumber}</span>
                                  <FileQuestion className="h-5 w-5 text-purple-600" />
                                  <Input
                                    value={typeof finalQuiz.title === 'object' ? (finalQuiz.title[locale] || finalQuiz.title.en || '') : (finalQuiz.title || '')}
                                    onChange={(e) => {
                                      const currentTitle = typeof finalQuiz.title === 'object' ? finalQuiz.title : { en: finalQuiz.title || '', ar: finalQuiz.title || '' }
                                      const newTitle = { ...currentTitle }
                                      newTitle[locale] = e.target.value
                                      setFormData(prev => {
                                        const newSections = prev.sections.map(s => {
                                          if (s.id === section.id) {
                                              const newQuizzes = (s.quizzes || []).map(q => {
                                                if (q.id === finalQuiz.id) {
                                                  return { ...q, title: newTitle }
                                                }
                                                return q
                                              })
                                            return { ...s, quizzes: newQuizzes }
                                          }
                                          return s
                                        })
                                        return { ...prev, sections: newSections }
                                      })
                                    }}
                                    placeholder={locale === 'ar' ? 'عنوان الاختبار' : 'Quiz title'}
                                    className="font-semibold"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <Label htmlFor={`quiz-passing-score-${finalQuiz.id}`} className="text-sm">
                                      {locale === 'ar' ? 'نقاط النجاح' : 'Passing Score'} (%)
                                    </Label>
                                    <Input
                                      id={`quiz-passing-score-${finalQuiz.id}`}
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={finalQuiz.passingScore || 70}
                                      onChange={(e) => {
                                        setFormData(prev => {
                                          const newSections = prev.sections.map(s => {
                                            if (s.id === section.id) {
                                              const newQuizzes = (s.quizzes || []).map(q => {
                                                if (q.id === finalQuiz.id) {
                                                  return { ...q, passingScore: parseInt(e.target.value) || 70 }
                                                }
                                                return q
                                              })
                                              return { ...s, quizzes: newQuizzes }
                                            }
                                            return s
                                          })
                                          return { ...prev, sections: newSections }
                                        })
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`quiz-max-attempts-${finalQuiz.id}`} className="text-sm">
                                      {locale === 'ar' ? 'عدد المحاولات' : 'Max Attempts'}
                                    </Label>
                                    <Input
                                      id={`quiz-max-attempts-${finalQuiz.id}`}
                                      type="number"
                                      min="1"
                                      value={finalQuiz.maxAttempts || 3}
                                      onChange={(e) => {
                                        setFormData(prev => {
                                          const newSections = prev.sections.map(s => {
                                            if (s.id === section.id) {
                                              const newQuizzes = (s.quizzes || []).map(q => {
                                                if (q.id === finalQuiz.id) {
                                                  return { ...q, maxAttempts: parseInt(e.target.value) || 3 }
                                                }
                                                return q
                                              })
                                              return { ...s, quizzes: newQuizzes }
                                            }
                                            return s
                                          })
                                          return { ...prev, sections: newSections }
                                        })
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-semibold">
                                      {locale === 'ar' ? 'الأسئلة' : 'Questions'}
                                    </Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newQuestion = {
                                          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                          type: 'single_choice',
                                          question: '',
                                          options: ['', '', '', ''],
                                          correctAnswer: 0,
                                        }
                                        
                                        setFormData(prev => {
                                          const newSections = prev.sections.map(s => {
                                            if (s.id === section.id) {
                                              const newQuizzes = (s.quizzes || []).map(q => {
                                                if (q.id === finalQuiz.id) {
                                                  const existingQuestions = Array.isArray(q.questions) ? q.questions : []
                                                  return {
                                                    ...q,
                                                    questions: [...existingQuestions, newQuestion]
                                                  }
                                                }
                                                return q
                                              })
                                              return { ...s, quizzes: newQuizzes }
                                            }
                                            return s
                                          })
                                          return { ...prev, sections: newSections }
                                        })
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      {locale === 'ar' ? 'إضافة سؤال' : 'Add Question'}
                                    </Button>
                                  </div>
                                  <div className="space-y-3">
                                    {(finalQuiz.questions || []).map((question, questionIdx) => (
                                      <Card key={question.id || `q-${questionIdx}`} className="p-3 bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-sm font-medium">
                                            {locale === 'ar' ? 'سؤال' : 'Question'} {questionIdx + 1}
                                          </span>
                                          <div className="flex gap-2">
                                            <select
                                              value={normalizeQuestionType(question.type)}
                                              onChange={(e) => {
                                                const nextType = e.target.value
                                                setFormData(prev => {
                                                  const newSections = prev.sections.map(s => {
                                                    if (s.id === section.id) {
                                                      const newQuizzes = (s.quizzes || []).map(q => {
                                                        if (q.id === finalQuiz.id) {
                                                          const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                          if (questions[questionIdx]) {
                                                            const current = { ...questions[questionIdx] }
                                                            const prevType = normalizeQuestionType(current.type)

                                                            if (nextType === 'true_false') {
                                                              current.type = 'true_false'
                                                              current.options = ['True', 'False']
                                                              current.correctAnswer = Math.min(Math.max(parseInt(current.correctAnswer ?? 0) || 0, 0), 1)
                                                              delete current.correctAnswers
                                                            } else if (nextType === 'multiple_select') {
                                                              current.type = 'multiple_select'
                                                              const opts = Array.isArray(current.options) && current.options.length >= 2 ? [...current.options] : ['', '', '', '']
                                                              current.options = opts
                                                              const ca = typeof current.correctAnswer === 'number' ? current.correctAnswer : 0
                                                              const existing = Array.isArray(current.correctAnswers) ? current.correctAnswers : (prevType === 'single_choice' ? [ca] : [])
                                                              current.correctAnswers = Array.from(new Set(existing.filter((x) => Number.isInteger(x) && x >= 0 && x < opts.length)))
                                                              delete current.correctAnswer
                                                            } else {
                                                              // single_choice
                                                              current.type = 'single_choice'
                                                              const opts = Array.isArray(current.options) && current.options.length >= 2 ? [...current.options] : ['', '', '', '']
                                                              current.options = opts
                                                              const fromMulti = Array.isArray(current.correctAnswers) ? current.correctAnswers : []
                                                              const chosen = typeof current.correctAnswer === 'number' ? current.correctAnswer : (fromMulti[0] ?? 0)
                                                              current.correctAnswer = Math.min(Math.max(chosen || 0, 0), opts.length - 1)
                                                              delete current.correctAnswers
                                                            }

                                                            // Ensure at least 2 options for choice types
                                                            if (current.type === 'single_choice' || current.type === 'multiple_select') {
                                                              if (!Array.isArray(current.options) || current.options.length < 2) {
                                                                current.options = ['', '']
                                                              }
                                                            }

                                                            questions[questionIdx] = current
                                                            return { ...q, questions }
                                                          }
                                                        }
                                                        return q
                                                      })
                                                      return { ...s, quizzes: newQuizzes }
                                                    }
                                                    return s
                                                  })
                                                  return { ...prev, sections: newSections }
                                                })
                                              }}
                                              className="text-xs border rounded px-2 py-1"
                                            >
                                              <option value="single_choice">{locale === 'ar' ? 'اختيار واحد' : 'Single choice (radio)'}</option>
                                              <option value="multiple_select">{locale === 'ar' ? 'اختيارات متعددة' : 'Multiple select (checkbox)'}</option>
                                              <option value="true_false">{locale === 'ar' ? 'صح/خطأ' : 'True/False'}</option>
                                            </select>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setFormData(prev => {
                                                  const newSections = prev.sections.map(s => {
                                                    if (s.id === section.id) {
                                                      const newQuizzes = (s.quizzes || []).map(q => {
                                                        if (q.id === finalQuiz.id) {
                                                          const questions = Array.isArray(q.questions) ? q.questions : []
                                                          return {
                                                            ...q,
                                                            questions: questions.filter((_, idx) => idx !== questionIdx)
                                                          }
                                                        }
                                                        return q
                                                      })
                                                      return { ...s, quizzes: newQuizzes }
                                                    }
                                                    return s
                                                  })
                                                  return { ...prev, sections: newSections }
                                                })
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3 text-red-600" />
                                            </Button>
                                          </div>
                                        </div>
                                        <Input
                                          value={question.question || ''}
                                          onChange={(e) => {
                                            setFormData(prev => {
                                              const newSections = prev.sections.map(s => {
                                                if (s.id === section.id) {
                                                  const newQuizzes = (s.quizzes || []).map(q => {
                                                    if (q.id === finalQuiz.id) {
                                                      const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                      if (questions[questionIdx]) {
                                                        questions[questionIdx] = { ...questions[questionIdx], question: e.target.value }
                                                        return { ...q, questions }
                                                      }
                                                    }
                                                    return q
                                                  })
                                                  return { ...s, quizzes: newQuizzes }
                                                }
                                                return s
                                              })
                                              return { ...prev, sections: newSections }
                                            })
                                          }}
                                          placeholder={locale === 'ar' ? 'أدخل السؤال...' : 'Enter question...'}
                                          className="mb-2 text-sm"
                                        />
                                        {(normalizeQuestionType(question.type) === 'single_choice' || normalizeQuestionType(question.type) === 'multiple_select') && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-sm font-medium">
                                                {locale === 'ar' ? 'الخيارات' : 'Choices'}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <Label htmlFor={`quiz-${finalQuiz.id}-question-${questionIdx}-choice-count`} className="text-xs text-gray-600">
                                                  {locale === 'ar' ? 'عدد الخيارات' : 'Count'}
                                                </Label>
                                                <Input
                                                  id={`quiz-${finalQuiz.id}-question-${questionIdx}-choice-count`}
                                                  type="number"
                                                  min="2"
                                                  max="10"
                                                  value={Array.isArray(question.options) ? question.options.length : 4}
                                                  onChange={(e) => {
                                                    const desired = Math.max(2, Math.min(10, parseInt(e.target.value || '0', 10) || 2))
                                                    setFormData(prev => {
                                                      const newSections = prev.sections.map(s => {
                                                        if (s.id === section.id) {
                                                          const newQuizzes = (s.quizzes || []).map(q => {
                                                            if (q.id === finalQuiz.id) {
                                                              const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                              const curr = questions[questionIdx]
                                                              if (!curr) return q
                                                              const currType = normalizeQuestionType(curr.type)
                                                              const opts = Array.isArray(curr.options) ? [...curr.options] : ['', '', '', '']
                                                              while (opts.length < desired) opts.push('')
                                                              if (opts.length > desired) opts.length = desired

                                                              // adjust correct answers
                                                              const updated = { ...curr, options: opts }
                                                              if (currType === 'single_choice') {
                                                                const ca = typeof updated.correctAnswer === 'number' ? updated.correctAnswer : 0
                                                                updated.correctAnswer = Math.min(Math.max(ca, 0), opts.length - 1)
                                                              } else if (currType === 'multiple_select') {
                                                                const cas = Array.isArray(updated.correctAnswers) ? updated.correctAnswers : []
                                                                updated.correctAnswers = cas.filter((x) => Number.isInteger(x) && x >= 0 && x < opts.length)
                                                              }
                                                              questions[questionIdx] = updated
                                                              return { ...q, questions }
                                                            }
                                                            return q
                                                          })
                                                          return { ...s, quizzes: newQuizzes }
                                                        }
                                                        return s
                                                      })
                                                      return { ...prev, sections: newSections }
                                                    })
                                                  }}
                                                  className="w-20 text-xs"
                                                />
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setFormData(prev => {
                                                      const newSections = prev.sections.map(s => {
                                                        if (s.id === section.id) {
                                                          const newQuizzes = (s.quizzes || []).map(q => {
                                                            if (q.id === finalQuiz.id) {
                                                              const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                              const curr = questions[questionIdx]
                                                              if (!curr) return q
                                                              const opts = Array.isArray(curr.options) ? [...curr.options] : ['', '', '', '']
                                                              if (opts.length >= 10) return q
                                                              opts.push('')
                                                              questions[questionIdx] = { ...curr, options: opts }
                                                              return { ...q, questions }
                                                            }
                                                            return q
                                                          })
                                                          return { ...s, quizzes: newQuizzes }
                                                        }
                                                        return s
                                                      })
                                                      return { ...prev, sections: newSections }
                                                    })
                                                  }}
                                                >
                                                  <Plus className="h-3 w-3 mr-1" />
                                                  {locale === 'ar' ? 'إضافة' : 'Add'}
                                                </Button>
                                              </div>
                                            </div>

                                            {(Array.isArray(question.options) && question.options.length >= 2 ? question.options : ['', '', '', '']).map((option, optIdx) => (
                                              <div key={optIdx} className="flex items-center gap-2">
                                                {normalizeQuestionType(question.type) === 'single_choice' ? (
                                                  <input
                                                    type="radio"
                                                    name={`quiz-${finalQuiz.id}-q-${questionIdx}`}
                                                    checked={(question.correctAnswer ?? 0) === optIdx}
                                                    onChange={() => {
                                                      setFormData(prev => {
                                                        const newSections = prev.sections.map(s => {
                                                          if (s.id === section.id) {
                                                            const newQuizzes = (s.quizzes || []).map(q => {
                                                              if (q.id === finalQuiz.id) {
                                                                const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                                if (questions[questionIdx]) {
                                                                  questions[questionIdx] = { ...questions[questionIdx], correctAnswer: optIdx }
                                                                  delete questions[questionIdx].correctAnswers
                                                                  return { ...q, questions }
                                                                }
                                                              }
                                                              return q
                                                            })
                                                            return { ...s, quizzes: newQuizzes }
                                                          }
                                                          return s
                                                        })
                                                        return { ...prev, sections: newSections }
                                                      })
                                                    }}
                                                  />
                                                ) : (
                                                  <input
                                                    type="checkbox"
                                                    checked={Array.isArray(question.correctAnswers) && question.correctAnswers.includes(optIdx)}
                                                    onChange={() => {
                                                      setFormData(prev => {
                                                        const newSections = prev.sections.map(s => {
                                                          if (s.id === section.id) {
                                                            const newQuizzes = (s.quizzes || []).map(q => {
                                                              if (q.id === finalQuiz.id) {
                                                                const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                                const curr = questions[questionIdx]
                                                                if (!curr) return q
                                                                const current = Array.isArray(curr.correctAnswers) ? [...curr.correctAnswers] : []
                                                                const next = current.includes(optIdx)
                                                                  ? current.filter((x) => x !== optIdx)
                                                                  : [...current, optIdx]
                                                                questions[questionIdx] = { ...curr, correctAnswers: next.sort((a, b) => a - b) }
                                                                delete questions[questionIdx].correctAnswer
                                                                return { ...q, questions }
                                                              }
                                                              return q
                                                            })
                                                            return { ...s, quizzes: newQuizzes }
                                                          }
                                                          return s
                                                        })
                                                        return { ...prev, sections: newSections }
                                                      })
                                                    }}
                                                  />
                                                )}

                                                <Input
                                                  value={option}
                                                  onChange={(e) => {
                                                    setFormData(prev => {
                                                      const newSections = prev.sections.map(s => {
                                                        if (s.id === section.id) {
                                                          const newQuizzes = (s.quizzes || []).map(q => {
                                                            if (q.id === finalQuiz.id) {
                                                              const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                              const curr = questions[questionIdx]
                                                              if (!curr) return q
                                                              const opts = Array.isArray(curr.options) ? [...curr.options] : ['', '', '', '']
                                                              opts[optIdx] = e.target.value
                                                              questions[questionIdx] = { ...curr, options: opts }
                                                              return { ...q, questions }
                                                            }
                                                            return q
                                                          })
                                                          return { ...s, quizzes: newQuizzes }
                                                        }
                                                        return s
                                                      })
                                                      return { ...prev, sections: newSections }
                                                    })
                                                  }}
                                                  placeholder={locale === 'ar' ? `خيار ${optIdx + 1}` : `Option ${optIdx + 1}`}
                                                  className="text-sm"
                                                />

                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  disabled={(Array.isArray(question.options) ? question.options.length : 4) <= 2}
                                                  onClick={() => {
                                                    setFormData(prev => {
                                                      const newSections = prev.sections.map(s => {
                                                        if (s.id === section.id) {
                                                          const newQuizzes = (s.quizzes || []).map(q => {
                                                            if (q.id === finalQuiz.id) {
                                                              const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                              const curr = questions[questionIdx]
                                                              if (!curr) return q
                                                              const opts = Array.isArray(curr.options) ? [...curr.options] : ['', '', '', '']
                                                              if (opts.length <= 2) return q
                                                              opts.splice(optIdx, 1)

                                                              const updated = { ...curr, options: opts }
                                                              const currType = normalizeQuestionType(updated.type)
                                                              if (currType === 'single_choice') {
                                                                const ca = typeof updated.correctAnswer === 'number' ? updated.correctAnswer : 0
                                                                if (ca === optIdx) updated.correctAnswer = 0
                                                                else if (ca > optIdx) updated.correctAnswer = ca - 1
                                                                updated.correctAnswer = Math.min(Math.max(updated.correctAnswer || 0, 0), opts.length - 1)
                                                              } else if (currType === 'multiple_select') {
                                                                const cas = Array.isArray(updated.correctAnswers) ? updated.correctAnswers : []
                                                                updated.correctAnswers = cas
                                                                  .filter((x) => x !== optIdx)
                                                                  .map((x) => (x > optIdx ? x - 1 : x))
                                                                  .filter((x) => x >= 0 && x < opts.length)
                                                              }

                                                              questions[questionIdx] = updated
                                                              return { ...q, questions }
                                                            }
                                                            return q
                                                          })
                                                          return { ...s, quizzes: newQuizzes }
                                                        }
                                                        return s
                                                      })
                                                      return { ...prev, sections: newSections }
                                                    })
                                                  }}
                                                  title={locale === 'ar' ? 'حذف الخيار' : 'Remove option'}
                                                >
                                                  <Trash2 className="h-3 w-3 text-red-600" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {question.type === 'true_false' && (
                                          <div className="space-y-2">
                                            {['True', 'False'].map((option, optIdx) => (
                                              <div key={optIdx} className="flex items-center gap-2">
                                                <input
                                                  type="radio"
                                                  name={`quiz-${finalQuiz.id}-q-${questionIdx}`}
                                                  checked={question.correctAnswer === optIdx}
                                                  onChange={() => {
                                                    setFormData(prev => {
                                                      const newSections = prev.sections.map(s => {
                                                        if (s.id === section.id) {
                                                          const newQuizzes = (s.quizzes || []).map(q => {
                                                            if (q.id === finalQuiz.id) {
                                                              const questions = Array.isArray(q.questions) ? [...q.questions] : []
                                                              if (questions[questionIdx]) {
                                                                questions[questionIdx] = { ...questions[questionIdx], correctAnswer: optIdx }
                                                                return { ...q, questions }
                                                              }
                                                            }
                                                            return q
                                                          })
                                                          return { ...s, quizzes: newQuizzes }
                                                        }
                                                        return s
                                                      })
                                                      return { ...prev, sections: newSections }
                                                    })
                                                  }}
                                                />
                                                <span className="text-sm">{option}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </Card>
                                    ))}
                                    {(!finalQuiz.questions || finalQuiz.questions.length === 0) && (
                                      <p className="text-sm text-gray-500 text-center py-4">
                                        {locale === 'ar' ? 'لا توجد أسئلة. أضف سؤالك الأول' : 'No questions. Add your first question'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContent(section.id, finalQuiz.id, 'quiz')}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    // Article Content
                    if (content.type === 'article') {
                      const article = content
                      return (
                        <Card 
                          key={article.id} 
                          className="bg-gray-50"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', [section.id, article.id, contentIdx].join('|'))
                            e.currentTarget.classList.add('opacity-50')
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50')
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-2', 'border-blue-400')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                            const data = e.dataTransfer.getData('text/plain')
                            if (data) {
                              const parts = data.split('|')
                              if (parts.length >= 3 && parts[0] === section.id) {
                                const sourceIndex = parseInt(parts[2], 10)
                                if (!Number.isNaN(sourceIndex) && sourceIndex !== contentIdx) {
                                  reorderContent(section.id, sourceIndex, contentIdx)
                                }
                              }
                            }
                          }}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                  <span className="text-sm font-semibold text-gray-600">{contentNumber}</span>
                                  <BookOpen className="h-5 w-5 text-green-600" />
                                  <Input
                                    value={typeof article.title === 'object' ? (article.title[locale] || article.title.en || '') : (article.title || '')}
                                    onChange={(e) => {
                                      const currentTitle = typeof article.title === 'object' ? article.title : { en: article.title || '', ar: article.title || '' }
                                      const newTitle = { ...currentTitle }
                                      newTitle[locale] = e.target.value
                                      updateContent(section.id, article.id, 'article', { title: newTitle })
                                    }}
                                    placeholder={locale === 'ar' ? 'عنوان المقال *' : 'Article title *'}
                                    className="font-semibold"
                                    required
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContent(section.id, article.id, 'article')}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">{locale === 'ar' ? 'تنسيق النص' : 'Format'}</Label>
                              <div className="flex flex-wrap gap-1 p-2 border rounded-t-md bg-gray-50 border-b-0 rounded-b-none">
                                <button
                                  type="button"
                                  title="Bold"
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() => { document.execCommand('bold'); document.getElementById(`article-editor-${article.id}`)?.focus() }}
                                >
                                  <Bold className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Italic"
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() => { document.execCommand('italic'); document.getElementById(`article-editor-${article.id}`)?.focus() }}
                                >
                                  <Italic className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Underline"
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() => { document.execCommand('underline'); document.getElementById(`article-editor-${article.id}`)?.focus() }}
                                >
                                  <Underline className="h-4 w-4" />
                                </button>
                                <select
                                  className="text-sm border rounded px-2 py-1.5 bg-white"
                                  title="Font size"
                                  onChange={(e) => {
                                    const val = e.target.value
                                    e.target.value = ''
                                    if (val) document.execCommand(val === 'h2' ? 'formatBlock' : val === 'h3' ? 'formatBlock' : 'fontSize', false, val === 'h2' ? '<h2>' : val === 'h3' ? '<h3>' : val)
                                    document.getElementById(`article-editor-${article.id}`)?.focus()
                                  }}
                                >
                                  <option value="">{locale === 'ar' ? 'حجم الخط' : 'Size'}</option>
                                  <option value="1">Small</option>
                                  <option value="2">Normal</option>
                                  <option value="3">Large</option>
                                  <option value="h2">Heading 2</option>
                                  <option value="h3">Heading 3</option>
                                </select>
                                <button
                                  type="button"
                                  title="Bullet list"
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() => { document.execCommand('insertUnorderedList'); document.getElementById(`article-editor-${article.id}`)?.focus() }}
                                >
                                  <List className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Numbered list"
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() => { document.execCommand('insertOrderedList'); document.getElementById(`article-editor-${article.id}`)?.focus() }}
                                >
                                  <ListOrdered className="h-4 w-4" />
                                </button>
                              </div>
                              <ArticleRichEditor
                                articleId={article.id}
                                sectionId={section.id}
                                content={article.content || ''}
                                locale={locale}
                                updateContent={updateContent}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    // PDF Content
                    if (content.type === 'pdf') {
                      const pdf = content
                      return (
                        <Card 
                          key={pdf.id} 
                          className="bg-gray-50"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', [section.id, pdf.id, contentIdx].join('|'))
                            e.currentTarget.classList.add('opacity-50')
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50')
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-2', 'border-blue-400')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-2', 'border-blue-400')
                            const data = e.dataTransfer.getData('text/plain')
                            if (data) {
                              const parts = data.split('|')
                              if (parts.length >= 3 && parts[0] === section.id) {
                                const sourceIndex = parseInt(parts[2], 10)
                                if (!Number.isNaN(sourceIndex) && sourceIndex !== contentIdx) {
                                  reorderContent(section.id, sourceIndex, contentIdx)
                                }
                              }
                            }
                          }}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                  <span className="text-sm font-semibold text-gray-600">{contentNumber}</span>
                                  <File className="h-5 w-5 text-red-600" />
                                  <Input
                                    value={typeof pdf.title === 'object' ? (pdf.title[locale] || pdf.title.en || '') : (pdf.title || '')}
                                    onChange={(e) => {
                                      const currentTitle = typeof pdf.title === 'object' ? pdf.title : { en: pdf.title || '', ar: pdf.title || '' }
                                      const newTitle = { ...currentTitle }
                                      newTitle[locale] = e.target.value
                                      updateContent(section.id, pdf.id, 'pdf', { title: newTitle })
                                    }}
                                    placeholder={locale === 'ar' ? 'عنوان الملف *' : 'File title *'}
                                    className="font-semibold"
                                    required
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContent(section.id, pdf.id, 'pdf')}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                            <div>
                              <Label htmlFor={`pdf-upload-${pdf.id}`} className="text-sm">
                                {locale === 'ar' ? 'رفع ملف' : 'Upload File'}
                              </Label>
                              <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors mt-2"
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                                  const data = e.dataTransfer.getData('text/plain')
                                  const parts = data ? data.split('|') : []
                                  if (parts.length >= 3 && parts[0] === section.id) {
                                    const sourceIndex = parseInt(parts[2], 10)
                                    if (!Number.isNaN(sourceIndex) && sourceIndex !== contentIdx) {
                                      reorderContent(section.id, sourceIndex, contentIdx)
                                    }
                                    return
                                  }
                                  e.stopPropagation()
                                  const file = e.dataTransfer.files[0]
                                  if (file) handleFileUpload(section.id, pdf.id, file)
                                }}
                                onClick={() => document.getElementById(`pdf-upload-${pdf.id}`)?.click()}
                              >
                                {pdf.fileName ? (
                                  <div className="space-y-2">
                                    <File className="h-8 w-8 text-red-600 mx-auto" />
                                    <p className="text-sm font-medium">{pdf.fileName}</p>
                                    <p className="text-xs text-gray-500">
                                      {locale === 'ar' ? 'انقر لتغيير الملف' : 'Click to change file'}
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">
                                      {locale === 'ar' ? 'اسحب وأفلت ملف هنا أو انقر للرفع' : 'Drag and drop file here or click to upload'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {locale === 'ar' ? 'أي ملف حتى 100MB' : 'Any file up to 100MB'}
                                    </p>
                                  </div>
                                )}
                                <input
                                  id={`pdf-upload-${pdf.id}`}
                                  type="file"
                                  accept="*/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleFileUpload(section.id, pdf.id, file)
                                  }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }

                    // Fallback for unknown content types (should not happen)
                    return null
                    })
                  )}
                  

                    </CardContent>
                  )}
                </Card>

              </div>
            )
          })
        )}

        {/* Add section line at the very bottom */}
        <button
          type="button"
          onClick={() => addSectionAt((formData.sections || []).length)}
          className="group w-full border-2 border-dashed border-gray-200 rounded-lg py-4 px-4 text-left transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Plus className="h-4 w-4 transition-transform group-hover:scale-125" />
              <span className="text-sm font-semibold">
                {locale === 'ar' ? 'إضافة قسم' : 'Add Section'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {locale === 'ar' ? 'اسحب الأقسام لإعادة الترتيب' : 'Drag sections to reorder'}
            </span>
          </div>
        </button>
      </div>
    )
  }


  // Step 4: Preview & Submit
  const validateCourse = () => {
    const errors = []
    
    if (!formData.title.trim()) {
      errors.push(locale === 'ar' ? 'عنوان الدورة مطلوب' : 'Course title is required')
    }
    if (!formData.description.trim()) {
      errors.push(locale === 'ar' ? 'وصف الدورة مطلوب' : 'Course description is required')
    }
    if (!formData.thumbnail) {
      errors.push(locale === 'ar' ? 'صورة الدورة مطلوبة' : 'Course thumbnail is required')
    }
    if (formData.sections.length === 0) {
      errors.push(locale === 'ar' ? 'يجب إضافة قسم واحد على الأقل' : 'At least one section is required')
    }
    
    let hasVideo = false
    formData.sections.forEach((section, sIdx) => {
      const allContents = getAllContents(section)
      const videos = allContents.filter(c => c.type === 'video')
      if (videos.length === 0) {
        errors.push(
          locale === 'ar' 
            ? `القسم ${sIdx + 1} يجب أن يحتوي على فيديو واحد على الأقل`
            : `Section ${sIdx + 1} must contain at least one video`
        )
      } else {
        hasVideo = true
      }
    })
    
    if (!hasVideo) {
      errors.push(locale === 'ar' ? 'يجب إضافة فيديو واحد على الأقل' : 'At least one video is required')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmitForReview = async () => {
    if (!validateCourse()) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/instructor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId }),
      })

      if (res.ok) {
        alert(locale === 'ar' ? 'تم إرسال الدورة للمراجعة' : 'Course submitted for review')
        router.push('/instructor')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to submit')
      }
    } catch (error) {
      console.error('Error submitting course:', error)
      alert('Failed to submit course')
    } finally {
      setLoading(false)
    }
  }

  // Validate when reaching final step
  useEffect(() => {
    if (currentStep === 3) {
      validateCourse()
    }
  }, [currentStep])

  const Step4 = () => {
    const getLocalized = (val) => {
      if (val && typeof val === 'object') return val[locale] || val.en || ''
      return val || ''
    }

    const sections = formData.sections || []
    const totalVideos = sections.reduce((sum, section) => sum + ((section.videos || []).length), 0)
    const freeVideos = sections.reduce(
      (sum, section) => sum + (section.isFreePreview ? ((section.videos || []).length) : 0),
      0
    )
    const totalDurationSeconds = sections.reduce((sum, section) => {
      const sectionSeconds = (section.videos || []).reduce((s, v) => s + (Number(v.duration) || 0), 0)
      return sum + sectionSeconds
    }, 0)

    const formatDuration = (seconds) => {
      const sec = Math.max(0, Math.floor(Number(seconds) || 0))
      const h = Math.floor(sec / 3600)
      const m = Math.floor((sec % 3600) / 60)
      if (h > 0) return `${h}h ${m}m`
      return `${m}m`
    }

    return (
      <div className="space-y-6">
        {validationErrors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">
                    {locale === 'ar' ? 'أخطاء يجب إصلاحها قبل الإرسال:' : 'Errors to fix before submission:'}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User-style preview layout (similar to /courses/[id]) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                {formData.thumbnail ? (
                  <img src={formData.thumbnail} alt={formData.title} className="w-full h-full object-cover" />
                ) : (
                  <Play className="h-24 w-24 text-primary/50" />
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-3xl">{formData.title}</CardTitle>
                <CardDescription className="text-base mt-2">{formData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(totalDurationSeconds)}</span>
                  </div>
                  <div>
                    <span className="font-medium">{locale === 'ar' ? 'الفئة: ' : 'Category: '}</span>
                    <span>{formData.category}</span>
                  </div>
                  <div>
                    <span className="font-medium">{locale === 'ar' ? 'المستوى: ' : 'Level: '}</span>
                    <span>{formData.level}</span>
                  </div>
                  <div>
                    <span className="font-medium">{totalVideos}</span> <span>{locale === 'ar' ? 'فيديو' : 'videos'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'المحتوى' : 'Content'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sections.map((section, sIdx) => {
                    const sectionTitle = getLocalized(section.title) || (locale === 'ar' ? 'قسم بدون عنوان' : 'Untitled section')
                    const isFreeSection = !!section.isFreePreview

                    return (
                      <div key={section.id || sIdx} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">
                          {sIdx + 1}. {sectionTitle}
                          {isFreeSection && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {locale === 'ar' ? 'معاينة مجانية' : 'Free Preview'}
                            </span>
                          )}
                        </h3>

                        <div className="space-y-2">
                          {getAllContents(section).map((content, contentIdx) => {
                            const contentNumber = `${sIdx + 1}.${contentIdx + 1}`
                            const contentTitle = getLocalized(content.title) || (locale === 'ar' ? 'بدون عنوان' : 'Untitled')

                            let typeIcon = null
                            let typeLabel = ''
                            if (content.type === 'video') {
                              typeIcon = <Video className="h-5 w-5 text-blue-600" />
                              typeLabel = locale === 'ar' ? 'فيديو' : 'Video'
                            } else if (content.type === 'quiz') {
                              typeIcon = <FileQuestion className="h-5 w-5 text-purple-600" />
                              typeLabel = locale === 'ar' ? 'اختبار' : 'Quiz'
                            } else if (content.type === 'article') {
                              typeIcon = <BookOpen className="h-5 w-5 text-green-600" />
                              typeLabel = locale === 'ar' ? 'مقال' : 'Article'
                            } else if (content.type === 'pdf') {
                              typeIcon = <File className="h-5 w-5 text-red-600" />
                              typeLabel = locale === 'ar' ? 'ملف' : 'File'
                            }

                            const accessIcon = isFreeSection ? (
                              <Play className="h-5 w-5 text-primary" />
                            ) : (
                              <Lock className="h-5 w-5 text-gray-400" />
                            )

                            return (
                              <div
                                key={content.id || `${content.type}-${contentIdx}`}
                                className={`flex items-center justify-between p-3 rounded border transition-colors ${
                                  isFreeSection ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {content.type === 'video' ? accessIcon : (isFreeSection ? typeIcon : <Lock className="h-5 w-5 text-gray-400" />)}
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-600">{contentNumber}</span>
                                    {content.type !== 'video' && isFreeSection && typeIcon}
                                    <div>
                                      <p className="font-medium">{contentTitle}</p>
                                      <p className="text-sm text-gray-500">
                                        {typeLabel}
                                        {content.type === 'video' && content.duration ? ` • ${Math.floor(Number(content.duration) / 60)}:${(Number(content.duration) % 60).toString().padStart(2, '0')}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  {isFreeSection && (
                                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {locale === 'ar' ? 'مجاني' : 'Free'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}

                          {getAllContents(section).length === 0 && (
                            <p className="text-gray-400 italic">
                              {locale === 'ar' ? 'لا يوجد محتوى' : 'No content'}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="text-2xl">${formData.price || 0}</CardTitle>
                <CardDescription>
                  {locale === 'ar' ? 'سعر الدورة' : 'Course Price'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{locale === 'ar' ? 'الفيديوهات' : 'Videos'}</span>
                    <span className="font-medium">{totalVideos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{locale === 'ar' ? 'فيديوهات مجانية' : 'Free Videos'}</span>
                    <span className="font-medium">{freeVideos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{locale === 'ar' ? 'المدة' : 'Duration'}</span>
                    <span className="font-medium">{formatDuration(totalDurationSeconds)}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button className="w-full" disabled>
                    {locale === 'ar' ? 'اشترك الآن (معاينة)' : 'Enroll Now (Preview)'}
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-500">
                  {locale === 'ar'
                    ? 'هذه معاينة كما ستظهر للطلاب'
                    : 'This is a preview of how students will see it'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.title || !formData.description || !formData.thumbnail) {
        alert(locale === 'ar' ? 'يرجى إكمال جميع الحقول المطلوبة' : 'Please complete all required fields')
        return
      }

      // Create course if not created yet
      if (!courseId) {
        setSaving(true)
        try {
          const res = await fetch('/api/instructor/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title: { en: formData.title, ar: formData.title },
              description: { en: formData.description, ar: formData.description },
              shortDescription: formData.shortDescription,
              category: formData.category,
              level: formData.level,
              language: formData.language,
              price: formData.price,
              thumbnail: formData.thumbnail,
              sections: [],
            }),
          })

          if (res.ok) {
            const data = await res.json()
            setCourseId(data.course.id)
            setCurrentStep(2)
          } else {
            const error = await res.json()
            alert(error.error || 'Failed to create course')
          }
        } catch (error) {
          console.error('Error creating course:', error)
          alert('Failed to create course')
        } finally {
          setSaving(false)
        }
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (formData.sections.length === 0) {
        alert(locale === 'ar' ? 'يرجى إضافة قسم واحد على الأقل' : 'Please add at least one section')
        return
      }
      // Save builder (sections + content)
      await saveCourse()
      setCurrentStep(3)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveCourse = async () => {
    if (!courseId) return

    const totalDurationSeconds = (formData.sections || []).reduce((sum, section) => {
      const sectionSeconds = (section.videos || []).reduce((s, v) => s + (Number(v.duration) || 0), 0)
      return sum + sectionSeconds
    }, 0)
    const durationHours = Math.floor(totalDurationSeconds / 3600)
    const durationMinutes = Math.floor((totalDurationSeconds % 3600) / 60)
    const durationStr = durationHours === 0 && durationMinutes === 0
      ? '0 hours'
      : durationMinutes === 0
        ? (durationHours === 1 ? '1 hour' : `${durationHours} hours`)
        : `${durationHours}h ${durationMinutes}m`

    try {
      await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: { en: formData.title, ar: formData.title },
          description: { en: formData.description, ar: formData.description },
          shortDescription: formData.shortDescription,
          category: formData.category,
          level: formData.level,
          language: formData.language,
          price: formData.price,
          thumbnail: formData.thumbnail,
          sections: formData.sections,
          duration: durationStr,
        }),
      })
    } catch (error) {
      console.error('Error saving course:', error)
    }
  }

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return null
  }

  const stepTitles = [
    locale === 'ar' ? 'معلومات أساسية' : 'Basic Information',
    locale === 'ar' ? 'بناء الدورة' : 'Course Builder',
    locale === 'ar' ? 'معاينة وإرسال' : 'Preview & Submit',
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link href="/instructor">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'العودة' : 'Back'}
            </Button>
          </Link>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center justify-between gap-4 mb-4">
                {stepTitles.map((title, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="flex flex-col items-center w-[110px]">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          currentStep > idx + 1
                            ? 'bg-green-500 text-white'
                            : currentStep === idx + 1
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {currentStep > idx + 1 ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                      </div>
                      <span className={`mt-2 text-sm text-center ${currentStep === idx + 1 ? 'font-semibold' : ''}`}>
                        {title}
                      </span>
                    </div>
                    {idx < stepTitles.length - 1 && (
                      <div
                        className={`h-1 rounded w-10 sm:w-16 md:w-24 ${
                          currentStep > idx + 1 ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course'} - {stepTitles[currentStep - 1]}
              </CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? `الخطوة ${currentStep} من ${totalSteps}`
                  : `Step ${currentStep} of ${totalSteps}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && Step1()}
              {currentStep === 2 && Step3()}
              {currentStep === 3 && Step4()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <div className="flex gap-2">
                  {currentStep < totalSteps ? (
                    <Button onClick={handleNext} disabled={saving || loading}>
                      {saving ? (
                        locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                      ) : (
                        <>
                          {locale === 'ar' ? 'التالي' : 'Next'}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleSubmitForReview} disabled={loading || validationErrors.length > 0}>
                      {loading
                        ? (locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                        : (locale === 'ar' ? 'إرسال للمراجعة' : 'Submit for Review')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
