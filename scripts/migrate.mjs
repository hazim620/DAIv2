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
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('🔄 Starting database migration...')
    await client.query('BEGIN')
    await client.query(schema)
    await client.query('COMMIT')
    
    console.log('✅ Database migration completed successfully!')
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
    }
    console.error('❌ Migration error:', error.message)
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection troubleshooting:')
      console.error('   1. Check if RDS database is running')
      console.error('   2. Verify RDS security group allows your IP address')
      console.error('   3. Ensure database is publicly accessible (if connecting from local)')
      console.error('   4. Check your network/firewall settings')
      console.error('\n   To allow your IP in RDS Security Group:')
      console.error('   - Go to AWS RDS Console → Your DB → Connectivity & security')
      console.error('   - Click on VPC security group')
      console.error('   - Add inbound rule: PostgreSQL (5432) from your IP (0.0.0.0/0 for testing)')
    }
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
