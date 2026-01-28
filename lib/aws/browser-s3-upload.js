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


// Cache for runtime config
let runtimeConfig = null

async function getRuntimeConfig() {
  if (runtimeConfig) return runtimeConfig
  
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      runtimeConfig = await response.json()
      return runtimeConfig
    }
  } catch (error) {
    console.error('Failed to fetch runtime config:', error)
  }
  
  return {
    awsRegion: 'me-south-1',
    s3Bucket: 'dai-platform-media-prod',
    cloudfrontDomain: 'dph2pdp0ht6hr.cloudfront.net',
    cognitoIdentityPoolId: 'me-south-1:2a00695f-009a-4b97-be8c-5d0d1ac15dd2',
  }
}
export async function uploadToS3Direct({ kind, fileOrBlob, filename, contentType, courseId, sectionId }) {
  let region = getPublicEnv('NEXT_PUBLIC_APP_AWS_REGION') || getPublicEnv('NEXT_PUBLIC_AWS_REGION')
  let bucket = getPublicEnv('NEXT_PUBLIC_APP_S3_BUCKET') || getPublicEnv('NEXT_PUBLIC_S3_BUCKET')
  let cloudfrontDomain = getPublicEnv('NEXT_PUBLIC_APP_CLOUDFRONT_DOMAIN') || getPublicEnv('NEXT_PUBLIC_CLOUDFRONT_DOMAIN')
  let identityPoolId = getPublicEnv('NEXT_PUBLIC_APP_COGNITO_IDENTITY_POOL_ID') || getPublicEnv('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID')

  if (!region || !bucket || !cloudfrontDomain || !identityPoolId) {
    console.warn('NEXT_PUBLIC_* env vars not available, fetching from API...')
    const config = await getRuntimeConfig()
    region = region || config.awsRegion
    bucket = bucket || config.s3Bucket
    cloudfrontDomain = cloudfrontDomain || config.cloudfrontDomain
    identityPoolId = identityPoolId || config.cognitoIdentityPoolId
  }

  if (!region || !bucket || !cloudfrontDomain || !identityPoolId) {
    throw new Error('Missing AWS configuration. Please check environment variables in Amplify.')
  }

  // Ensure fileOrBlob is a proper Blob or File and convert to ArrayBuffer for AWS SDK
  let body = fileOrBlob
  if (!(body instanceof Blob) && !(body instanceof File)) {
    throw new Error('Invalid fileOrBlob: must be a Blob or File object')
  }
  
  // Convert Blob/File to ArrayBuffer for better AWS SDK compatibility
  // This avoids issues with chunked encoding streams
  const arrayBuffer = await body.arrayBuffer()

  const { identityId, credentials } = await getCognitoIdentityCredentials({ region, identityPoolId })
  const key = buildKey({ kind, courseId, sectionId, identityId, filename })
  const cacheControl = kind === 'thumbnail' ? 'public, max-age=31536000, immutable' : undefined
  const s3 = new S3Client({ region, credentials })
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: arrayBuffer, ContentType: contentType || 'application/octet-stream', ...(cacheControl ? { CacheControl: cacheControl } : {}) }))
  const publicUrl = `https://${cloudfrontDomain}/${key}`
  return { key, publicUrl }
}