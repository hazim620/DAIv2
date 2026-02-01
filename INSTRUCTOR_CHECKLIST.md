# Instructor Pages – Edit Checklist

All items below have been implemented.

---

## 1. Mobile phone validation (instructor signup)

- **Frontend** (`app/instructor/signup/page.jsx`): Mobile must have 9–15 digits after optional country code (`+` or `00`). Placeholder: `+966 5XXXXXXXX`. Hint: "With country code, 9–15 digits".
- **Backend** (`app/api/instructor/signup/route.js`): Same rule; returns error if invalid.

---

## 2. Password: رمز اجباري بدل رقم + symbol

- **Label**: "كلمة المرور" → "الرمز" (AR), "Password" unchanged (EN). Confirm label: "تأكيد الرمز" (AR).
- **Rules**: 8+ chars, uppercase, lowercase, number, **and at least one symbol** (`!@#$%^&*()_+-=[]{};':"\\|,.<>/?`).
- **Hint**: "8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، رمز خاص (!@#$%...)" / "At least 8 characters, uppercase, lowercase, number, symbol (!@#$%...)".
- **Backend**: Instructor signup API validates symbol in password.

---

## 3. Nationality and country of residence – dropdowns

- **Nationality** and **Country of Residence** are `<select>` dropdowns.
- Options from `lib/instructor-form-data.js`: `COUNTRIES` (Saudi Arabia, UAE, Bahrain, Kuwait, Oman, Qatar, Egypt, Jordan, Lebanon, Syria, Iraq, Yemen, Palestine, Morocco, Algeria, Tunisia, Libya, Sudan, Pakistan, India, Bangladesh, Turkey, Malaysia, Indonesia, US, UK, Canada, Australia, Other).
- Labels: "الجنسية *" / "Nationality *", "دولة الإقامة *" / "Country of Residence *".

---

## 4. Date validation in signup

- **Required**: Date of birth is required.
- **Not future**: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" / "Date of birth cannot be in the future".
- **Age ≥ 18**: "يجب أن يكون عمرك 18 سنة على الأقل" / "You must be at least 18 years old".
- **Invalid date**: "تاريخ الميلاد غير صحيح" / "Invalid date of birth".

---

## 5. Remove "Other" from gender

- Gender options: **Male** (ذكر) and **Female** (أنثى) only. "Other" / "آخر" removed.

---

## 6. Universities – dropdown

- **University** is a `<select>`.
- Options from `lib/instructor-form-data.js`: `UNIVERSITIES` (e.g. King Saud, KFUPM, KAU, Qassim, Taibah, Islamic University, Prince Sattam, Umm Al-Qura, Jazan, King Khalid, Najran, Al-Baha, UAEU, AUS, AUB, Cairo, Other).

---

## 7. Majors – dropdown

- **Major** is a `<select>`.
- Options from `lib/instructor-form-data.js`: `MAJORS` (e.g. Computer Science, IT, Engineering, Business, Accounting, Finance, Marketing, Law, Medicine, Pharmacy, Nursing, Education, Arabic, English, Math, Physics, Chemistry, Biology, Islamic Studies, Other).

---

## 8. Students per فصل → per course

- Label: "عدد الطلاب المتوقع لكل فصل *" → **"عدد الطلاب المتوقع لكل دورة *"** (AR).
- Label: "Expected Students Per Term *" → **"Expected Students Per Course *"** (EN).
- Validation message: "عدد الطلاب المتوقع لكل دورة مطلوب" / "Expected students per course is required".
- Field name in form/API remains `expectedStudentsPerTerm` (no DB change).

---

## 9. Remove "تريد التدريس" – just "Join as instructor"

- **Login** (`app/login/page.jsx`): Removed "تريد التدريس؟ " / "Want to teach? "; only link text "انضم كمدرب" / "Join as instructor" remains.
- **Signup** (`app/signup/page.jsx`): Same: removed "تريد التدريس؟ " / "Want to teach? "; only "انضم كمدرب" / "Join as instructor" link.

---

## 10. Login: email not approved → wait for approval message

- **API** (`app/api/auth/login/route.js`): For instructors with `account_status === 'pending_admin_approval'`, response is **403** with message: **"Please wait for approval. Your account is under review."**
- Frontend shows this message in the login error area when the API returns it.

---

## Files touched

| File | Changes |
|------|--------|
| `app/instructor/signup/page.jsx` | Mobile validation, password (رمز + symbol), nationality/country dropdowns, date validation, gender without Other, university/major dropdowns, students per course label |
| `app/api/instructor/signup/route.js` | Mobile length validation, password symbol validation |
| `app/api/auth/login/route.js` | Pending-approval message text |
| `app/login/page.jsx` | Instructor link text only (no "تريد التدريس؟") |
| `app/signup/page.jsx` | Instructor link text only (no "تريد التدريس؟") |
| `lib/instructor-form-data.js` | **New**: `COUNTRIES`, `UNIVERSITIES`, `MAJORS` |
