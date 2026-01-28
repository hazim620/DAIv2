// AWS Lambda signer for S3 pre-signed PUT URLs (uses aws-sdk v2 which is built-in on Lambda)
// Runtime: Node.js 18.x
//
// Env vars required:
// - BUCKET: S3 bucket name (e.g., dai-platform-media-prod)
// - CLOUDFRONT_DOMAIN: CloudFront domain (e.g., dph2pdp0ht6hr.cloudfront.net)
// - SIGNER_TOKEN: shared secret, must match APP_PRESIGN_SERVICE_TOKEN in Amplify
//
// Optional:
// - REGION: override region (defaults to AWS_REGION)
//
const crypto = require('crypto')
const AWS = require('aws-sdk')

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function safeFilename(name) {
  const base = String(name || 'file')
    .replace(/[/\\?%*:|"<>]/g, '-')
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

exports.handler = async (event) => {
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || ''
    const expected = process.env.SIGNER_TOKEN || ''
    if (!expected) return json(500, { error: 'Missing env SIGNER_TOKEN' })
    if (auth !== `Bearer ${expected}`) return json(401, { error: 'Unauthorized' })

    const bucket = process.env.BUCKET
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
    if (!bucket) return json(500, { error: 'Missing env BUCKET' })
    if (!cloudfrontDomain) return json(500, { error: 'Missing env CLOUDFRONT_DOMAIN' })

    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})
    const { kind, filename, contentType, courseId, sectionId } = body

    const prefix = prefixForKind(kind)
    if (!prefix) return json(400, { error: 'Invalid kind. Use thumbnail|video|file' })
    if (!filename || !contentType) return json(400, { error: 'filename and contentType are required' })

    const region = process.env.REGION || process.env.AWS_REGION
    const s3 = new AWS.S3({ signatureVersion: 'v4', region })

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

    const uploadUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 10,
      ContentType: contentType,
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    })

    const publicUrl = `https://${cloudfrontDomain}/${key}`
    return json(200, { key, uploadUrl, publicUrl })
  } catch (e) {
    return json(500, { error: 'Internal server error', details: e?.message || null })
  }
}

