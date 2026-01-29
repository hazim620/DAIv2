// Test endpoint to check if environment variables are available
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Check all possible environment variable sources
  const allEnvKeys = Object.keys(process.env).filter(key => 
    key.includes('AWS') || 
    key.includes('CLOUDFRONT') || 
    key.includes('APP_')
  ).sort()

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
    },
    // Show all AWS/APP related env vars (without values for security)
    availableEnvKeys: allEnvKeys,
    nodeEnv: process.env.NODE_ENV,
    amplifyEnv: process.env.AWS_EXECUTION_ENV || 'not set',
  })
}
