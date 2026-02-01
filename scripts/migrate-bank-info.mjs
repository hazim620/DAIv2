import dotenv from 'dotenv'
dotenv.config()

import { getPool } from '../lib/postgres.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  const pool = getPool()
  let client = null

  try {
    console.log('🔄 Connecting to database...')
    console.log(`   Host: ${process.env.DB_HOST || '(from .env)'}`)
    console.log(`   Database: ${process.env.DB_NAME || '(from .env)'}`)

    client = await pool.connect()
    console.log('✅ Connected to database!')

    const migrationPath = path.join(__dirname, '..', 'database', 'migration_bank_info_discounts.sql')
    const migration = fs.readFileSync(migrationPath, 'utf8')

    console.log('🔄 Running bank_info + discount_codes migration...')
    await client.query('BEGIN')

    await client.query(migration)

    await client.query('COMMIT')

    console.log('✅ Migration completed successfully! (users.bank_info + discount_codes table)')
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
    }
    console.error('❌ Migration error:', error.message)
    throw error
  } finally {
    if (client) {
      client.release()
    }
    await pool.end()
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
