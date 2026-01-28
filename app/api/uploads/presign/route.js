import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Ensure this route runs on Node.js (not Edge), because it uses Node crypto + AWS SDK signing.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getEnv(name) {
  return process.env[name]
}

function requireEnv(name) {
  const v = getEnv(name)
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

function requireAnyEnv(names) {
  for (const n of names) {
    const v = getEnv(n)
    if (v) return { name: n, value: v }
  }
  throw new Error(`Missing environment variable: ${names[0]}`)
}

function safeFilename(name) {
  const base = String(name || 'file')
    .replace(/[/\\?%*:|"<>]/g, '-') // windows + url unsafe
    .replace(/\s+/g, '-')
    .slice(0, 120)
  return base || 'file'
}

function extFromName(name) {
  const m = String(name || '').match(/\.([a-zA-Z0-9]{1,10})$/)
  return m ? m[1].toLowerCase() : ''
}

function prefixForKind(kind) {
  if (kind === 'thumbnail') return 'thumbnails'
  if (kind === 'video') return 'videos'
  if (kind === 'file') return 'files'
  return null
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized - Instructor access required' }, { status: 403 })
    }

    const body = await request.json()
    const { kind, filename, contentType, courseId, sectionId } = body || {}

    const prefix = prefixForKind(kind)
    if (!prefix) {
      return Response.json({ error: 'Invalid kind. Use thumbnail|video|file' }, { status: 400 })
    }
    if (!filename || !contentType) {
      return Response.json({ error: 'filename and contentType are required' }, { status: 400 })
    }

    // Prefer APP_* vars, but fall back to AWS-provided region vars if present in runtime.
    const region = requireAnyEnv(['APP_AWS_REGION', 'AWS_REGION', 'AWS_DEFAULT_REGION']).value
    const bucket = requireEnv('APP_S3_BUCKET')
    const cloudfrontDomain = requireEnv('APP_CLOUDFRONT_DOMAIN')

    const accessKeyId = requireEnv('APP_AWS_ACCESS_KEY_ID')
    const secretAccessKey = requireEnv('APP_AWS_SECRET_ACCESS_KEY')

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })

    const uuid = crypto.randomUUID()
    const safeName = safeFilename(filename)
    const ext = extFromName(safeName)

    const cid = courseId ? String(courseId) : 'tmp'
    const sid = sectionId ? String(sectionId) : null

    const keyParts = [prefix, cid]
    if (sid) keyParts.push(sid)
    keyParts.push(`${uuid}${ext ? `.${ext}` : ''}-${safeName}`)
    const key = keyParts.join('/')

    const cacheControl = kind === 'thumbnail'
      ? 'public, max-age=31536000, immutable'
      : undefined

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 10 }) // 10 minutes
    const publicUrl = `https://${cloudfrontDomain}/${key}`

    return Response.json({ key, uploadUrl, publicUrl })
  } catch (error) {
    console.error('Presign upload error:', error)
    const msg = error?.message || null
    // Surface config errors clearly (safe: only env var name)
    if (msg && msg.startsWith('Missing environment variable:')) {
      const envPresence = {
        APP_AWS_REGION: !!process.env.APP_AWS_REGION,
        AWS_REGION: !!process.env.AWS_REGION,
        AWS_DEFAULT_REGION: !!process.env.AWS_DEFAULT_REGION,
        APP_S3_BUCKET: !!process.env.APP_S3_BUCKET,
        APP_CLOUDFRONT_DOMAIN: !!process.env.APP_CLOUDFRONT_DOMAIN,
        APP_AWS_ACCESS_KEY_ID: !!process.env.APP_AWS_ACCESS_KEY_ID,
        APP_AWS_SECRET_ACCESS_KEY: !!process.env.APP_AWS_SECRET_ACCESS_KEY,
      }
      return Response.json(
        { error: 'Upload presign is not configured', details: msg, envPresence },
        { status: 500 }
      )
    }
    return Response.json(
      {
        error: 'Internal server error',
        details: error?.message || null,
        name: error?.name || null,
        code: error?.code || null,
      },
      { status: 500 }
    )
  }
}

