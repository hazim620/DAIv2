'use client'

import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } from '@aws-sdk/client-cognito-identity'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function getPublicEnv(name) {
  // Next.js inlines NEXT_PUBLIC_* at build time for client bundles.
  return process.env[name]
}

function requirePublicEnv(name) {
  const v = getPublicEnv(name)
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
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

function uuid() {
  try {
    // Modern browsers
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

async function getCognitoIdentityCredentials({ region, identityPoolId }) {
  const client = new CognitoIdentityClient({ region })

  const idRes = await client.send(new GetIdCommand({ IdentityPoolId: identityPoolId }))
  const identityId = idRes?.IdentityId
  if (!identityId) throw new Error('Failed to get Cognito IdentityId')

  const credsRes = await client.send(new GetCredentialsForIdentityCommand({ IdentityId: identityId }))
  const c = credsRes?.Credentials
  if (!c?.AccessKeyId || !c?.SecretKey) throw new Error('Failed to get Cognito temporary credentials')

  return {
    identityId,
    credentials: {
      accessKeyId: c.AccessKeyId,
      secretAccessKey: c.SecretKey,
      sessionToken: c.SessionToken,
      expiration: c.Expiration,
    },
  }
}

function buildKey({ kind, courseId, sectionId, identityId, filename }) {
  const prefix = prefixForKind(kind)
  if (!prefix) throw new Error('Invalid kind. Use thumbnail|video|file')

  const safeName = safeFilename(filename)
  const ext = extFromName(safeName)

  const cid = courseId ? String(courseId) : 'tmp'
  const sid = sectionId ? String(sectionId) : null

  // IMPORTANT:
  // Use a path that can be restricted by the Identity Pool role policy using the identityId:
  // e.g. allow PutObject only to: private/${cognito-identity.amazonaws.com:sub}/*
  const keyParts = ['private', identityId, prefix, cid]
  if (sid) keyParts.push(sid)
  keyParts.push(`${uuid()}${ext ? `.${ext}` : ''}-${safeName}`)

  return keyParts.join('/')
}

export async function uploadToS3Direct({ kind, fileOrBlob, filename, contentType, courseId, sectionId }) {
  const region =
    getPublicEnv('NEXT_PUBLIC_APP_AWS_REGION') ||
    getPublicEnv('NEXT_PUBLIC_AWS_REGION') ||
    null
  const bucket =
    getPublicEnv('NEXT_PUBLIC_APP_S3_BUCKET') ||
    getPublicEnv('NEXT_PUBLIC_S3_BUCKET') ||
    null
  const cloudfrontDomain =
    getPublicEnv('NEXT_PUBLIC_APP_CLOUDFRONT_DOMAIN') ||
    getPublicEnv('NEXT_PUBLIC_CLOUDFRONT_DOMAIN') ||
    null
  const identityPoolId =
    getPublicEnv('NEXT_PUBLIC_APP_COGNITO_IDENTITY_POOL_ID') ||
    getPublicEnv('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID') ||
    null

  if (!region) throw new Error('Missing environment variable: NEXT_PUBLIC_APP_AWS_REGION')
  if (!bucket) throw new Error('Missing environment variable: NEXT_PUBLIC_APP_S3_BUCKET')
  if (!cloudfrontDomain) throw new Error('Missing environment variable: NEXT_PUBLIC_APP_CLOUDFRONT_DOMAIN')
  if (!identityPoolId) throw new Error('Missing environment variable: NEXT_PUBLIC_APP_COGNITO_IDENTITY_POOL_ID')

  const { identityId, credentials } = await getCognitoIdentityCredentials({ region, identityPoolId })
  const key = buildKey({ kind, courseId, sectionId, identityId, filename })

  const cacheControl = kind === 'thumbnail' ? 'public, max-age=31536000, immutable' : undefined

  const s3 = new S3Client({ region, credentials })
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileOrBlob,
      ContentType: contentType || 'application/octet-stream',
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    })
  )

  const publicUrl = `https://${cloudfrontDomain}/${key}`
  return { key, publicUrl }
}

