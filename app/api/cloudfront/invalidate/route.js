import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { paths } = await request.json()
    
    if (!paths || !Array.isArray(paths)) {
      return Response.json({ error: 'Paths array is required' }, { status: 400 })
    }

    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || 'EGYXGZXQ4IAXY'
    const region = process.env.APP_AWS_REGION || 'me-south-1'

    // Check if credentials are available
    const hasExplicitCredentials = !!(process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY)
    
    if (!hasExplicitCredentials) {
      // No credentials available - skip invalidation gracefully
      console.warn('CloudFront invalidation skipped: AWS credentials not configured. Add APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY to enable invalidation.')
      return Response.json({ 
        success: true, 
        skipped: true,
        message: 'CloudFront invalidation skipped - credentials not configured'
      })
    }

    // Use explicit credentials
    const client = new CloudFrontClient({ 
      region,
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      }
    })

    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
        CallerReference: `invalidate-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
    })

    const result = await client.send(command)

    return Response.json({ 
      success: true, 
      invalidationId: result.Invalidation?.Id,
      status: result.Invalidation?.Status 
    })
  } catch (error) {
    console.error('CloudFront invalidation error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'EGYXGZXQ4IAXY',
      region: process.env.APP_AWS_REGION || 'me-south-1',
      hasCredentials: !!(process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY),
    })
    return Response.json({ 
      error: error.message || 'Failed to invalidate CloudFront cache',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        name: error.name,
      } : undefined
    }, { status: 500 })
  }
}
