// Shared options for instructor signup form
import { key_countries } from 'country-list-translate-json'

// Build nationality list from country-list-translate-json (for nationality dropdown)
export const COUNTRIES = Object.keys(key_countries || {}).map((nameEn) => {
  const data = key_countries[nameEn]
  return {
    value: data?.code || nameEn,
    labelEn: nameEn,
    labelAr: data?.name_ar || nameEn,
  }
}).filter((c) => c.value && c.labelEn)

// Saudi Arabia fixed for instructors (country of residence)
const saudiEntry = Object.entries(key_countries || {}).find(([, d]) => d?.code === 'SA')
export const SAUDI_ARABIA = saudiEntry
  ? { labelEn: saudiEntry[0], labelAr: saudiEntry[1]?.name_ar || 'المملكة العربية السعودية' }
  : { labelEn: 'Saudi Arabia', labelAr: 'المملكة العربية السعودية' }

export const UNIVERSITIES = [
  { value: 'KSU', labelEn: 'King Saud University', labelAr: 'جامعة الملك سعود' },
  { value: 'KFUPM', labelEn: 'King Fahd University of Petroleum & Minerals', labelAr: 'جامعة الملك فهد للبترول والمعادن' },
  { value: 'KAU', labelEn: 'King Abdulaziz University', labelAr: 'جامعة الملك عبدالعزيز' },
  { value: 'QU', labelEn: 'Qassim University', labelAr: 'جامعة القصيم' },
  { value: 'TU', labelEn: 'Taibah University', labelAr: 'جامعة طيبة' },
  { value: 'IU', labelEn: 'Islamic University of Madinah', labelAr: 'الجامعة الإسلامية بالمدينة' },
  { value: 'PSAU', labelEn: 'Prince Sattam bin Abdulaziz University', labelAr: 'جامعة الأمير سطام بن عبدالعزيز' },
  { value: 'UQU', labelEn: "Umm Al-Qura University", labelAr: 'جامعة أم القرى' },
  { value: 'JU', labelEn: 'Jazan University', labelAr: 'جامعة جازان' },
  { value: 'KKU', labelEn: 'King Khalid University', labelAr: 'جامعة الملك خالد' },
  { value: 'NU', labelEn: 'Najran University', labelAr: 'جامعة نجران' },
  { value: 'BU', labelEn: 'Al-Baha University', labelAr: 'جامعة الباحة' },
  { value: 'UAEU', labelEn: 'United Arab Emirates University', labelAr: 'جامعة الإمارات' },
  { value: 'AUS', labelEn: 'American University of Sharjah', labelAr: 'الجامعة الأمريكية بالشارقة' },
  { value: 'AUB', labelEn: 'American University of Beirut', labelAr: 'الجامعة الأمريكية في بيروت' },
  { value: 'CU', labelEn: 'Cairo University', labelAr: 'جامعة القاهرة' },
  { value: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
]

export const MAJORS = [
  { value: 'cs', labelEn: 'Computer Science', labelAr: 'علوم الحاسب' },
  { value: 'it', labelEn: 'Information Technology', labelAr: 'تقنية المعلومات' },
  { value: 'engineering', labelEn: 'Engineering', labelAr: 'الهندسة' },
  { value: 'business', labelEn: 'Business Administration', labelAr: 'إدارة الأعمال' },
  { value: 'accounting', labelEn: 'Accounting', labelAr: 'المحاسبة' },
  { value: 'finance', labelEn: 'Finance', labelAr: 'التمويل' },
  { value: 'marketing', labelEn: 'Marketing', labelAr: 'التسويق' },
  { value: 'law', labelEn: 'Law', labelAr: 'القانون' },
  { value: 'medicine', labelEn: 'Medicine', labelAr: 'الطب' },
  { value: 'pharmacy', labelEn: 'Pharmacy', labelAr: 'الصيدلة' },
  { value: 'nursing', labelEn: 'Nursing', labelAr: 'التمريض' },
  { value: 'education', labelEn: 'Education', labelAr: 'التعليم' },
  { value: 'arabic', labelEn: 'Arabic Language & Literature', labelAr: 'اللغة العربية وآدابها' },
  { value: 'english', labelEn: 'English Language & Literature', labelAr: 'اللغة الإنجليزية وآدابها' },
  { value: 'math', labelEn: 'Mathematics', labelAr: 'الرياضيات' },
  { value: 'physics', labelEn: 'Physics', labelAr: 'الفيزياء' },
  { value: 'chemistry', labelEn: 'Chemistry', labelAr: 'الكيمياء' },
  { value: 'biology', labelEn: 'Biology', labelAr: 'الأحياء' },
  { value: 'islamic_studies', labelEn: 'Islamic Studies', labelAr: 'الدراسات الإسلامية' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
]
