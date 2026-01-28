// Test endpoint to check if environment variables are available
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    hasAccessKey: !!process.env.APP_AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.APP_AWS_SECRET_ACCESS_KEY,
    hasDistributionId: !!process.env.CLOUDFRONT_DISTRIBUTION_ID,
    hasRegion: !!process.env.APP_AWS_REGION,
    accessKeyPrefix: process.env.APP_AWS_ACCESS_KEY_ID 
      ? process.env.APP_AWS_ACCESS_KEY_ID.substring(0, 8) + '...' 
      : 'missing',
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'not set',
    region: process.env.APP_AWS_REGION || 'not set',
    allEnvVars: {
      APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID ? 'set' : 'missing',
      APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY ? 'set' : 'missing',
      CLOUDFRONT_DISTRIBUTION_ID: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'missing',
      APP_AWS_REGION: process.env.APP_AWS_REGION || 'missing',
    }
  })
}
