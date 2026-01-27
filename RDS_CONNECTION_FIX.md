# Fixing RDS Connection Timeout

If you're getting a connection timeout error, follow these steps:

## Step 1: Check RDS Database Status

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Find your database: `dai-platform-db`
3. Verify status is **Available**

## Step 2: Configure RDS Security Group

Your RDS instance needs to allow connections from your IP address.

### Option A: Allow Your Current IP (Recommended for Testing)

1. In RDS Console, click on your database
2. Go to **Connectivity & security** tab
3. Click on the **VPC security group** link (opens in new tab)
4. Click **Edit inbound rules**
5. Click **Add rule**:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: My IP (or manually enter your IP like `123.45.67.89/32`)
6. Click **Save rules**

### Option B: Allow All IPs (For Testing Only - NOT for Production)

⚠️ **WARNING**: Only use this for testing!

1. Follow steps 1-4 above
2. Add rule:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: `0.0.0.0/0`
3. Click **Save rules**

## Step 3: Verify Database is Publicly Accessible

1. In RDS Console, click on your database
2. Go to **Connectivity & security** tab
3. Check **Publicly accessible** - should be **Yes** (for local connections)
4. If it's **No**, click **Modify** and change it to **Yes**
5. Apply changes (this may take a few minutes)

## Step 4: Test Connection

After updating the security group, wait 1-2 minutes, then try again:

```bash
npm run migrate
```

## Step 5: Verify Connection Details

Make sure your `.env` file has the correct values:

```env
DB_HOST=dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=true
```

## Alternative: Use AWS Systems Manager Session Manager

If you can't make the database publicly accessible, you can:

1. Connect to an EC2 instance in the same VPC
2. Run the migration from there
3. Or use AWS Systems Manager Session Manager to tunnel

## Still Having Issues?

1. **Check CloudWatch Logs**: Look for connection errors in RDS logs
2. **Verify Endpoint**: Make sure the endpoint is correct
3. **Test with psql**: Try connecting with PostgreSQL client:
   ```bash
   psql -h dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com -U postgres -d postgres
   ```
4. **Check Network**: Ensure your firewall/antivirus isn't blocking port 5432

## For Production (Amplify)

When deploying to Amplify, you'll need to:

1. Allow Amplify's security group in RDS security group
2. Or use VPC peering/connection between Amplify and RDS
3. Set environment variables in Amplify Console

The connection will work from Amplify once the security group is configured correctly.
