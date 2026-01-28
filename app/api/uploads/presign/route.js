// This project now uses direct browser -> S3 uploads via Cognito Identity Pool.
// We intentionally disable server-side presigning (no Lambda, no server credentials required).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json(
    {
      error: 'Presign disabled',
      details:
        'Direct browser-to-S3 uploads are enabled. Configure NEXT_PUBLIC_APP_COGNITO_IDENTITY_POOL_ID and related NEXT_PUBLIC_APP_* S3 vars.',
    },
    { status: 410 }
  )
}

