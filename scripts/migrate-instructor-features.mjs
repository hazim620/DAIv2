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
    console.log(`   Host: ${process.env.DB_HOST || 'dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com'}`)
    console.log(`   Database: ${process.env.DB_NAME || 'postgres'}`)
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`)
    
    client = await pool.connect()
    console.log('✅ Connected to database!')
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migration_instructor_features.sql')
    const migration = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('🔄 Starting instructor features migration...')
    await client.query('BEGIN')
    
    // Execute the entire migration as one block
    // PostgreSQL can handle multiple statements separated by semicolons
    await client.query(migration)
    
    await client.query('COMMIT')
    
    console.log('✅ Instructor features migration completed successfully!')
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
    }
    console.error('❌ Migration error:', error.message)
    console.error('Error details:', error)
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
