import dotenv from 'dotenv'
dotenv.config()

import { getPool } from '../lib/postgres.js'

// Password: 1122334455 (base64 encoded, same as schema.sql)
const PASSWORD_B64 = 'MTEyMjMzNDQ1NQ=='

async function seed() {
  const pool = getPool()
  let client = null

  try {
    console.log('🔄 Connecting to database...')
    client = await pool.connect()
    console.log('✅ Connected!')

    await client.query('BEGIN')

    // Insert admin and instructor (skip if email exists)
    await client.query(
      `INSERT INTO users (id, email, password, name, role) VALUES
       ($1, $2, $3, $4, $5),
       ($6, $7, $3, $8, $9)
       ON CONFLICT (email) DO NOTHING`,
      [
        'test-admin-001',
        'admin@admin.com',
        PASSWORD_B64,
        'Test Admin',
        'admin',
        'test-instructor-001',
        'ins@ins.com',
        'Test Instructor',
        'instructor',
      ]
    )

    // Ensure instructor can log in: set approved and email verified
    await client.query(
      `UPDATE users SET account_status = 'approved', email_verified = true
       WHERE email = 'ins@ins.com' AND role = 'instructor'`
    )

    await client.query('COMMIT')
    console.log('✅ Admin and instructor users ready.')
    console.log('   Admin:      admin@admin.com  / 1122334455')
    console.log('   Instructor: ins@ins.com      / 1122334455')
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    console.error('❌ Seed error:', err.message)
    throw err
  } finally {
    client?.release()
    await pool.end()
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
