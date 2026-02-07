# Environment Setup (Local, Preprod, Prod)

Copy the appropriate example to `.env` when running or migrating locally:

```powershell
# Local dev (Docker DB)
copy .env.local.example .env

# Preprod (tunnel to preprod RDS)
copy .env.preprod.example .env

# Prod (tunnel to prod RDS)
copy .env.prod.example .env
```

---

## Data You Need to Provide

Replace the placeholders in each example with your actual values.

### Local (.env.local.example)

| Placeholder | Description |
|-------------|-------------|
| `<YOUR_AWS_ACCESS_KEY>` | AWS access key (same or dev IAM) |
| `<YOUR_AWS_SECRET_KEY>` | AWS secret key |
| `<YOUR_DEV_CLOUDFRONT_DOMAIN>` | CloudFront distribution domain for dev bucket (e.g. `d1234abcd`) |
| `<YOUR_DEV_DISTRIBUTION_ID>` | CloudFront distribution ID for dev |
| `<SAME_OR_DEV_IDENTITY_POOL_ID>` | Cognito Identity Pool ID (e.g. `me-south-1:xxx`) |

### Preprod (.env.preprod.example)

| Placeholder | Description |
|-------------|-------------|
| `<PREPROD_DB_USER>` | Preprod DB user (e.g. `dai_migrator_preprod` or `postgres`) |
| `<PREPROD_DB_PASSWORD>` | Preprod DB password |
| `<PREPROD_JWT_SECRET_MIN_32_CHARS>` | JWT secret for preprod (32+ chars) |
| `<YOUR_AWS_ACCESS_KEY>` | AWS access key |
| `<YOUR_AWS_SECRET_KEY>` | AWS secret key |
| `<YOUR_PREPROD_CLOUDFRONT_DOMAIN>` | CloudFront domain for preprod bucket |
| `<YOUR_PREPROD_DISTRIBUTION_ID>` | CloudFront distribution ID for preprod |
| `<SAME_OR_PREPROD_IDENTITY_POOL_ID>` | Cognito Identity Pool ID |

### Prod (.env.prod.example)

| Placeholder | Description |
|-------------|-------------|
| `<PROD_DB_NAME>` | Prod database name |
| `<PROD_DB_USER>` | Prod DB user |
| `<PROD_DB_PASSWORD>` | Prod DB password |
| `<PROD_JWT_SECRET_MIN_32_CHARS>` | JWT secret for prod (32+ chars, unique) |
| `<YOUR_AWS_ACCESS_KEY>` | AWS access key |
| `<YOUR_AWS_SECRET_KEY>` | AWS secret key |
| `<YOUR_PROD_DISTRIBUTION_ID>` | CloudFront distribution ID for prod |
| `<YOUR_IDENTITY_POOL_ID>` | Cognito Identity Pool ID |

---

## Tunnel Ports (if using SSH tunnel)

- Preprod: localhost:5433 → preprod RDS
- Prod: localhost:5434 → prod RDS

Adjust `DB_HOST` and `DB_PORT` in each env if your tunnel uses different ports.
