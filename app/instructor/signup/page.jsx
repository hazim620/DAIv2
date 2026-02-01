'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { useLanguage } from '@/contexts/language-context'
import { COUNTRIES, SAUDI_ARABIA } from '@/lib/instructor-form-data'

const SAUDI_PHONE_PREFIX = '+966'

export default function InstructorSignupPage() {
  const router = useRouter()
  const { locale, t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Info
    nationality: '',
    countryOfResidence: SAUDI_ARABIA.labelEn,
    educationLevel: '',
    dateOfBirth: '',
    gender: '',
    
    // Step 3: Background
    universityName: '',
    major: '',
    readinessLevel: '',
    expectedStudentsPerTerm: '',
    howDidYouHear: '',
    
    // Step 4: Terms
    agreedToTerms: false,
  })

  const validateStep1 = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = locale === 'ar' ? 'الاسم الأول مطلوب' : 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = locale === 'ar' ? 'اسم العائلة مطلوب' : 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = locale === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format'
    }
    // Mobile: Saudi only — +966 then 9 digits starting with 5
    const raw = (formData.mobileNumber || '').replace(/\s/g, '')
    const has966 = raw.startsWith('+966') || raw.startsWith('966')
    const digitsOnly = raw.replace(/^\+?966/, '').replace(/\D/g, '')
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = locale === 'ar' ? 'رقم الجوال مطلوب' : 'Mobile number is required'
    } else if (!has966 || digitsOnly.length !== 9) {
      newErrors.mobileNumber = locale === 'ar'
        ? 'رقم الجوال يجب أن يبدأ بـ +966 ويتبعه 9 أرقام (مثال: 501234567)'
        : 'Mobile must start with +966 followed by 9 digits (e.g. 501234567)'
    } else if (digitsOnly[0] !== '5') {
      newErrors.mobileNumber = locale === 'ar'
        ? 'رقم الجوال السعودي يبدأ بـ 5 (مثال: 501234567)'
        : 'Saudi mobile number must start with 5 (e.g. 501234567)'
    }

    // Password: 8+ chars, uppercase, lowercase, number, symbol
    if (!formData.password) {
      newErrors.password = locale === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required'
    } else {
      if (formData.password.length < 8) {
        newErrors.password = locale === 'ar'
          ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
          : 'Password must be at least 8 characters'
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = locale === 'ar'
          ? 'كلمة المرور يجب أن تحتوي على حرف كبير'
          : 'Password must contain an uppercase letter'
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = locale === 'ar'
          ? 'كلمة المرور يجب أن تحتوي على حرف صغير'
          : 'Password must contain a lowercase letter'
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = locale === 'ar'
          ? 'كلمة المرور يجب أن تحتوي على رقم'
          : 'Password must contain a number'
      } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) {
        newErrors.password = locale === 'ar'
          ? 'كلمة المرور يجب أن تحتوي على رمز خاص (!@#$%...)'
          : 'Password must contain a symbol (!@#$%...)'
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = locale === 'ar'
        ? 'كلمات المرور غير متطابقة'
        : 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    
    if (!formData.nationality.trim()) {
      newErrors.nationality = locale === 'ar' ? 'الجنسية مطلوبة' : 'Nationality is required'
    }
    // Country of residence is fixed to Saudi — no validation needed
    if (!formData.educationLevel.trim()) {
      newErrors.educationLevel = locale === 'ar' ? 'المستوى التعليمي مطلوب' : 'Education level is required'
    }
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = locale === 'ar' ? 'تاريخ الميلاد مطلوب' : 'Date of birth is required'
    } else {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      if (Number.isNaN(dob.getTime())) {
        newErrors.dateOfBirth = locale === 'ar' ? 'تاريخ الميلاد غير صحيح' : 'Invalid date of birth'
      } else if (dob > today) {
        newErrors.dateOfBirth = locale === 'ar' ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' : 'Date of birth cannot be in the future'
      } else {
        const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000))
        if (age < 18) {
          newErrors.dateOfBirth = locale === 'ar' ? 'يجب أن يكون عمرك 18 سنة على الأقل' : 'You must be at least 18 years old'
        }
      }
    }
    if (!formData.gender.trim()) {
      newErrors.gender = locale === 'ar' ? 'الجنس مطلوب' : 'Gender is required'
    }
    if (!formData.howDidYouHear.trim()) {
      newErrors.howDidYouHear = locale === 'ar' ? 'كيف سمعت عنا مطلوب' : 'How did you hear about us is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    let isValid = false
    if (currentStep === 1) isValid = validateStep1()
    else if (currentStep === 2) isValid = validateStep2()
    if (isValid && currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.agreedToTerms) {
      setErrors({ agreedToTerms: locale === 'ar' ? 'يجب الموافقة على الشروط' : 'You must agree to the terms' })
      return
    }
    
    setLoading(true)
    setErrors({})
    
    try {
      const response = await fetch('/api/instructor/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Show success message and redirect to email verification page
        router.push(`/instructor/signup/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setErrors({ general: data.error || 'Registration failed' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{locale === 'ar' ? 'الاسم الأول *' : 'First Name *'}</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{locale === 'ar' ? 'اسم العائلة *' : 'Last Name *'}</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{locale === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobileNumber">{locale === 'ar' ? 'رقم الجوال *' : 'Mobile Number *'}</Label>
        <div dir="ltr" className="flex rounded-md border border-gray-300 overflow-hidden">
          <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 border-r border-gray-300 font-medium">
            {SAUDI_PHONE_PREFIX}
          </span>
          <Input
            id="mobileNumber"
            name="mobileNumber"
            type="tel"
            inputMode="numeric"
            maxLength={9}
            placeholder="501234567"
            className="rounded-none border-0 focus-visible:ring-0"
            value={formData.mobileNumber.replace(/^\+966/, '').replace(/\D/g, '').slice(0, 9)}
            onChange={(e) => {
              let digits = e.target.value.replace(/\D/g, '').slice(0, 9)
              if (digits.length > 0 && digits[0] !== '5') digits = '5' + digits.slice(0, 8)
              setFormData((prev) => ({ ...prev, mobileNumber: digits ? `${SAUDI_PHONE_PREFIX}${digits}` : '' }))
              if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: undefined }))
            }}
            required
            disabled={loading}
          />
        </div>
        {errors.mobileNumber && <p className="text-sm text-red-600">{errors.mobileNumber}</p>}
        <p className="text-xs text-gray-500">{locale === 'ar' ? '9 أرقام تبدأ بـ 5 بعد +966 (مثال: 501234567)' : '9 digits starting with 5 after +966 (e.g. 501234567)'}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{locale === 'ar' ? 'كلمة المرور *' : 'Password *'}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
        <p className="text-xs text-gray-500">
          {locale === 'ar'
            ? '8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، رمز خاص (!@#$%...)'
            : 'At least 8 characters, uppercase, lowercase, number, symbol (!@#$%...)'}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{locale === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nationality">{locale === 'ar' ? 'الجنسية *' : 'Nationality *'}</Label>
        <select
          id="nationality"
          name="nationality"
          value={formData.nationality}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          disabled={loading}
        >
          <option value="">{locale === 'ar' ? 'اختر الجنسية...' : 'Select nationality...'}</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.labelEn}>
              {locale === 'ar' ? c.labelAr : c.labelEn}
            </option>
          ))}
        </select>
        {errors.nationality && <p className="text-sm text-red-600">{errors.nationality}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="countryOfResidence">{locale === 'ar' ? 'دولة الإقامة *' : 'Country of Residence *'}</Label>
        <Input
          id="countryOfResidence"
          name="countryOfResidence"
          readOnly
          disabled
          value={locale === 'ar' ? SAUDI_ARABIA.labelAr : SAUDI_ARABIA.labelEn}
          className="bg-gray-100 opacity-75 cursor-not-allowed select-none"
        />
        <p className="text-xs text-gray-500">{locale === 'ar' ? 'يجب ان تكون دولة اقامة المدرب المملكة العربية السعودية' : 'Instructors are from Saudi Arabia only'}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="educationLevel">{locale === 'ar' ? 'المستوى التعليمي *' : 'Education Level *'}</Label>
        <select
          id="educationLevel"
          name="educationLevel"
          value={formData.educationLevel}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          required
          disabled={loading}
        >
          <option value="">{locale === 'ar' ? 'اختر...' : 'Select...'}</option>
          <option value="high_school">{locale === 'ar' ? 'ثانوي' : 'High School'}</option>
          <option value="bachelor">{locale === 'ar' ? 'بكالوريوس' : 'Bachelor'}</option>
          <option value="master">{locale === 'ar' ? 'ماجستير' : 'Master'}</option>
          <option value="phd">{locale === 'ar' ? 'دكتوراه' : 'PhD'}</option>
        </select>
        {errors.educationLevel && <p className="text-sm text-red-600">{errors.educationLevel}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">{locale === 'ar' ? 'تاريخ الميلاد *' : 'Date of Birth *'}</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          max={(() => {
            const d = new Date()
            d.setFullYear(d.getFullYear() - 18)
            return d.toISOString().slice(0, 10)
          })()}
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">{locale === 'ar' ? 'الجنس *' : 'Gender *'}</Label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          required
          disabled={loading}
        >
          <option value="">{locale === 'ar' ? 'اختر...' : 'Select...'}</option>
          <option value="male">{locale === 'ar' ? 'ذكر' : 'Male'}</option>
          <option value="female">{locale === 'ar' ? 'أنثى' : 'Female'}</option>
        </select>
        {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="howDidYouHear">{locale === 'ar' ? 'كيف سمعت عنا؟ *' : 'How did you hear about us? *'}</Label>
        <Input
          id="howDidYouHear"
          name="howDidYouHear"
          value={formData.howDidYouHear}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.howDidYouHear && <p className="text-sm text-red-600">{errors.howDidYouHear}</p>}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
        <h3 className="font-semibold mb-2">{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</h3>
        <p className="text-sm text-gray-700">
          {locale === 'ar' 
            ? 'هنا سيتم عرض الشروط والأحكام...'
            : 'Terms and conditions will be displayed here...'}
        </p>
      </div>
      <div className="flex items-start space-x-2">
        <input
          id="agreedToTerms"
          name="agreedToTerms"
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={handleChange}
          className="mt-1"
          disabled={loading}
        />
        <Label htmlFor="agreedToTerms" className="text-sm">
          {locale === 'ar' 
            ? 'أوافق على الشروط والأحكام *'
            : 'I agree to the terms and conditions *'}
        </Label>
      </div>
      {errors.agreedToTerms && <p className="text-sm text-red-600">{errors.agreedToTerms}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">
              {locale === 'ar' ? 'تسجيل معلم جديد' : 'Instructor Registration'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? `الخطوة ${currentStep} من 3`
                : `Step ${currentStep} of 3`}
            </CardDescription>
            <div className="flex justify-center space-x-2 mt-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-12 rounded ${step <= currentStep ? 'bg-primary' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded mb-4">
                {errors.general}
              </div>
            )}
            
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              
              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 || loading}
                >
                  {locale === 'ar' ? 'السابق' : 'Back'}
                </Button>
                {currentStep < 3 ? (
                  <Button type="submit" disabled={loading}>
                    {locale === 'ar' ? 'التالي' : 'Next'}
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading 
                      ? (locale === 'ar' ? 'جاري التسجيل...' : 'Registering...')
                      : (locale === 'ar' ? 'تسجيل' : 'Register')}
                  </Button>
                )}
              </div>
            </form>
            
            <div className="text-center text-sm mt-4">
              <span className="text-gray-600">
                {locale === 'ar' ? 'لديك حساب؟ ' : 'Already have an account? '}
              </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
