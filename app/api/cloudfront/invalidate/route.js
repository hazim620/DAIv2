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
    return Response.json({ 
      error: error.message || 'Failed to invalidate CloudFront cache' 
    }, { status: 500 })
  }
}
