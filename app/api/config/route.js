// API endpoint to provide public configuration to the client
// This is a fallback when NEXT_PUBLIC_* variables aren't available at build time
export async function GET() {
  return Response.json({
    awsRegion: process.env.NEXT_PUBLIC_APP_AWS_REGION || process.env.APP_AWS_REGION || 'me-south-1',
    s3Bucket: process.env.NEXT_PUBLIC_APP_S3_BUCKET || process.env.APP_S3_BUCKET || 'dai-platform-media-prod',
    cloudfrontDomain: process.env.NEXT_PUBLIC_APP_CLOUDFRONT_DOMAIN || process.env.APP_CLOUDFRONT_DOMAIN || 'dph2pdp0ht6hr.cloudfront.net',
    cognitoIdentityPoolId: process.env.NEXT_PUBLIC_APP_COGNITO_IDENTITY_POOL_ID || 'me-south-1:2a00695f-009a-4b97-be8c-5d0d1ac15dd2',
  })
}
