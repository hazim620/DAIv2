# Quick Fix: RDS Connection Timeout

## The Problem
Your RDS database is rejecting connections because the security group doesn't allow your IP address.

## Solution (5 Minutes)

### Step 1: Open AWS RDS Console
1. Go to: https://console.aws.amazon.com/rds/
2. Make sure you're in the **me-south-1** region (Bahrain)
3. Find your database: `dai-platform-db`

### Step 2: Update Security Group (CRITICAL)
1. Click on your database name
2. Click the **"Connectivity & security"** tab
3. Find **"VPC security group"** - click on the security group link (it's a clickable link)
4. In the new tab, click **"Edit inbound rules"** button
5. Click **"Add rule"**
6. Configure:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: 
     - Option A: Click "My IP" (recommended)
     - Option B: Type `0.0.0.0/0` (allows all IPs - for testing only)
7. Click **"Save rules"**

### Step 3: Check Public Access
1. Still in RDS Console → Your Database → Connectivity & security
2. Check **"Publicly accessible"** - should say **"Yes"**
3. If it says **"No"**:
   - Click **"Modify"** button
   - Find **"Public access"** section
   - Select **"Publicly accessible"** = **Yes**
   - Click **"Continue"**
   - Choose **"Apply immediately"**
   - Click **"Modify DB instance"**
   - Wait 2-3 minutes for changes to apply

### Step 4: Test Connection
Wait 1-2 minutes after saving security group rules, then run:

```bash
npm run test-db
```

If connection succeeds, you'll see:
```
✅ Successfully connected!
✅ Database query successful!
```

### Step 5: Run Migration
Once connection test passes:

```bash
npm run migrate
```

## Still Not Working?

### Option 1: Use AWS CloudShell
1. Open AWS CloudShell (top right in AWS Console)
2. Upload your project files
3. Run migration from CloudShell (it's in the same AWS network)

### Option 2: Use EC2 Instance
1. Launch an EC2 instance in the same VPC as RDS
2. SSH into it
3. Run migration from there

### Option 3: Check Your IP
Your IP might have changed. Re-run Step 2 and use "My IP" again.

## Visual Guide

```
AWS RDS Console
  └─ Your Database (dai-platform-db)
      └─ Connectivity & security tab
          ├─ VPC security group → [CLICK THIS LINK]
          │   └─ Edit inbound rules
          │       └─ Add rule: PostgreSQL (5432) from My IP
          │
          └─ Publicly accessible → Should be "Yes"
              └─ If "No" → Click Modify → Change to "Yes"
```

## Common Mistakes

❌ **Wrong**: Only updating RDS settings without touching security group
✅ **Correct**: Must update BOTH security group AND public access

❌ **Wrong**: Using wrong region
✅ **Correct**: Make sure you're in **me-south-1** (Bahrain)

❌ **Wrong**: Not waiting for changes to apply
✅ **Correct**: Wait 1-2 minutes after saving security group rules

## Need Help?

Run the diagnostic:
```bash
npm run test-db
```

This will show exactly what's wrong with detailed error messages.
