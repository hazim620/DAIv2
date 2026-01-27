import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg'
const { Client } = pg

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'dai-platform-db.cnkksc4kgd5b.me-south-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  }

  console.log('🔍 Testing database connection...')
  console.log(`   Host: ${config.host}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   Database: ${config.database}`)
  console.log(`   User: ${config.user}`)
  console.log(`   SSL: ${config.ssl ? 'Enabled' : 'Disabled'}`)
  console.log('')

  const client = new Client(config)

  try {
    console.log('⏳ Attempting to connect...')
    await client.connect()
    console.log('✅ Successfully connected!')

    // Test a simple query
    const result = await client.query('SELECT version(), current_database(), current_user')
    console.log('✅ Database query successful!')
    console.log('')
    console.log('📊 Database Info:')
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(',')[0]}`)
    console.log(`   Current Database: ${result.rows[0].current_database}`)
    console.log(`   Current User: ${result.rows[0].current_user}`)
    console.log('')
    console.log('✅ Connection test passed! You can now run the migration.')

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed!')
    console.error('')
    console.error('Error details:')
    console.error(`   Code: ${error.code || 'N/A'}`)
    console.error(`   Message: ${error.message}`)
    console.error('')
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
      console.error('🔧 Troubleshooting Steps:')
      console.error('')
      console.error('1. Check RDS Security Group:')
      console.error('   - Go to AWS RDS Console → Your Database')
      console.error('   - Click "Connectivity & security" tab')
      console.error('   - Click on the VPC security group link')
      console.error('   - Add inbound rule: PostgreSQL (5432) from your IP or 0.0.0.0/0')
      console.error('')
      console.error('2. Verify Database is Publicly Accessible:')
      console.error('   - In RDS Console → Connectivity & security')
      console.error('   - Check "Publicly accessible" should be "Yes"')
      console.error('   - If "No", click "Modify" and change to "Yes"')
      console.error('')
      console.error('3. Check Your Network:')
      console.error('   - Ensure your firewall/antivirus allows port 5432')
      console.error('   - Try from a different network (mobile hotspot)')
      console.error('')
      console.error('4. Test with psql (if installed):')
      console.error(`   psql -h ${config.host} -U ${config.user} -d ${config.database}`)
      console.error('')
      console.error('5. Alternative: Run migration from AWS CloudShell or EC2 in same VPC')
    } else if (error.code === '28P01' || error.message.includes('password')) {
      console.error('🔧 Authentication Error:')
      console.error('   - Check your DB_PASSWORD in .env file')
      console.error('   - Verify username and password are correct')
    } else if (error.code === '3D000' || error.message.includes('database')) {
      console.error('🔧 Database Error:')
      console.error('   - Check your DB_NAME in .env file')
      console.error('   - Verify the database exists')
    }

    await client.end().catch(() => {})
    process.exit(1)
  }
}

testConnection()
