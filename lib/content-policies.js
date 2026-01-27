// Content policy validation utilities

export function validateVideo(video) {
  const errors = []
  
  if (!video.url) {
    errors.push('Video URL is required')
    return { valid: false, errors }
  }

  // Check if it's a YouTube/Vimeo URL (allowed)
  if (video.url.includes('youtube.com') || video.url.includes('youtu.be') || video.url.includes('vimeo.com')) {
    return { valid: true, errors: [] }
  }

  // For direct file URLs, check format
  const urlLower = video.url.toLowerCase()
  const allowedFormats = ['.mp4', '.webm', '.ogg']
  const hasValidFormat = allowedFormats.some(format => urlLower.endsWith(format))
  
  if (!hasValidFormat) {
    errors.push('Video must be in mp4, webm, or ogg format')
  }

  // Note: File size and quality validation would require actual file upload
  // For now, we validate URL format only
  // In production, validate during upload:
  // - Max size: 500MB (configurable)
  // - Min resolution: 720p
  // - Recommended: 1080p

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validatePDF(pdf) {
  const errors = []
  
  if (!pdf.url && !pdf.file) {
    errors.push('PDF file or URL is required')
    return { valid: false, errors }
  }

  // If it's a file object, validate it
  if (pdf.file) {
    // Max size: 50MB
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (pdf.file.size > maxSize) {
      errors.push('PDF file size must be less than 50MB')
    }

    // Check file type
    if (pdf.file.type !== 'application/pdf') {
      errors.push('File must be a PDF')
    }
  }

  // If it's a URL, check extension
  if (pdf.url && !pdf.url.toLowerCase().endsWith('.pdf')) {
    errors.push('PDF URL must point to a .pdf file')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateCourseContent(course) {
  const errors = []
  const warnings = []

  // Basic metadata validation
  if (!course.title || (typeof course.title === 'object' && !course.title.en)) {
    errors.push('Course title is required')
  }
  if (!course.description || (typeof course.description === 'object' && !course.description.en)) {
    errors.push('Course description is required')
  }
  if (!course.thumbnail) {
    errors.push('Course thumbnail is required')
  }

  // Sections validation
  if (!course.sections || course.sections.length === 0) {
    errors.push('At least one section is required')
  } else {
    let totalVideos = 0
    let hasFreePreview = false

    course.sections.forEach((section, sIdx) => {
      if (section.isFreePreview) {
        hasFreePreview = true
        // Free preview section must have at least one video
        if (!section.videos || section.videos.length === 0) {
          errors.push(`Free preview section ${sIdx + 1} must contain at least one video`)
        }
      }

      if (section.videos && section.videos.length > 0) {
        totalVideos += section.videos.length
        
        // Validate each video
        section.videos.forEach((video, vIdx) => {
          const videoValidation = validateVideo(video)
          if (!videoValidation.valid) {
            errors.push(`Section ${sIdx + 1}, Video ${vIdx + 1}: ${videoValidation.errors.join(', ')}`)
          }
        })
      }

      // Validate PDFs
      if (section.pdfs && section.pdfs.length > 0) {
        section.pdfs.forEach((pdf, pIdx) => {
          const pdfValidation = validatePDF(pdf)
          if (!pdfValidation.valid) {
            errors.push(`Section ${sIdx + 1}, PDF ${pIdx + 1}: ${pdfValidation.errors.join(', ')}`)
          }
        })
      }
    })

    if (totalVideos === 0) {
      errors.push('At least one video is required across all sections')
    }

    if (!hasFreePreview) {
      warnings.push('Consider adding a free preview section to attract students')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
