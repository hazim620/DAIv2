# Presign signer (Amplify credential fix)

If your Amplify runtime returns:

- `CredentialsProviderError: Could not load credentials from any providers`

…it means the server runtime that runs `POST /api/uploads/presign` has **no AWS credentials** available. The most reliable fix on Amplify is to use a small regional AWS Lambda to generate pre-signed PUT URLs.

## 1) Rotate leaked keys (IMPORTANT)

If you ever pasted or committed an AWS Access Key / Secret, rotate them immediately in IAM.

## 2) Create the signer Lambda (AWS Console)

- **Service**: Lambda
- **Create function**: Author from scratch
- **Name**: `dai-presign-signer`
- **Runtime**: Node.js 18.x
- **Permissions**: Create a new role with basic Lambda permissions (or select an existing one)

### Code

Use the file:

- `aws/presign-lambda/index.js`

Paste it into the Lambda editor as `index.js` and set handler to:

- `index.handler`

### Environment variables (Lambda)

- `BUCKET` = `dai-platform-media-prod`
- `CLOUDFRONT_DOMAIN` = `dph2pdp0ht6hr.cloudfront.net`
- `SIGNER_TOKEN` = (generate a long random secret)
- (optional) `REGION` = `me-south-1`

## 3) IAM policy for the signer role

Attach a policy to the Lambda execution role that allows PUT on your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutToMediaBucket",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": ["arn:aws:s3:::dai-platform-media-prod/*"]
    }
  ]
}
```

## 4) Expose the signer (Lambda Function URL)

- **Configuration** → **Function URL**
- Create Function URL
- **Auth type**: `NONE` (we secure it with `SIGNER_TOKEN` header)
- Copy the Function URL

## 5) Add env vars in Amplify (runtime)

In Amplify **Environment variables** add:

- `APP_PRESIGN_SERVICE_URL` = (Lambda Function URL)
- `APP_PRESIGN_SERVICE_TOKEN` = (same as `SIGNER_TOKEN`)

Redeploy Amplify.

## 6) Test

Try uploading a thumbnail in the instructor course builder again.

If it fails, open DevTools → Network → `POST /api/uploads/presign` and paste the JSON response.

