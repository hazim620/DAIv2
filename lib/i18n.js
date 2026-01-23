// Simple i18n implementation
export const translations = {
  en: {
    // Navigation
    home: "Home",
    courses: "Courses",
    about: "About",
    contact: "Contact",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    
    // Landing Page
    heroTitle: "Learn Data Science & AI",
    heroSubtitle: "Master the skills you need to excel in the world of data and artificial intelligence",
    getStarted: "Get Started",
    exploreCourses: "Explore Courses",
    
    // Auth
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    createAccount: "Create Account",
    
    // Courses
    allCourses: "All Courses",
    myCourses: "My Courses",
    courseDetails: "Course Details",
    enrollNow: "Enroll Now",
    watchPreview: "Watch Preview",
    free: "Free",
    sections: "Sections",
    videos: "Videos",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    courses: "الدورات",
    about: "من نحن",
    contact: "اتصل بنا",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    logout: "تسجيل الخروج",
    
    // Landing Page
    heroTitle: "تعلم علوم البيانات والذكاء الاصطناعي",
    heroSubtitle: "أتقن المهارات التي تحتاجها للتميز في عالم البيانات والذكاء الاصطناعي",
    getStarted: "ابدأ الآن",
    exploreCourses: "استكشف الدورات",
    
    // Auth
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    fullName: "الاسم الكامل",
    rememberMe: "تذكرني",
    forgotPassword: "نسيت كلمة المرور؟",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    dontHaveAccount: "ليس لديك حساب؟",
    createAccount: "إنشاء حساب",
    
    // Courses
    allCourses: "جميع الدورات",
    myCourses: "دوراتي",
    courseDetails: "تفاصيل الدورة",
    enrollNow: "سجل الآن",
    watchPreview: "شاهد المعاينة",
    free: "مجاني",
    sections: "الأقسام",
    videos: "الفيديوهات",
    
    // Common
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجح",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
  },
}

export function getTranslation(locale, key) {
  return translations[locale]?.[key] || key
}
