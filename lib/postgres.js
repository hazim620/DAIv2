import pg from 'pg'
const { Pool } = pg

let pool = null

export function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST || 'dai-platform.cnkksc4kgd5b.me-south-1.rds.amazonaws.com'
    // AWS RDS requires SSL - always enable it for RDS endpoints
    const isRDS = host.includes('.rds.amazonaws.com') || host.includes('.rds.')
    const useSSL = isRDS || process.env.DB_SSL === 'true'
    
    pool = new Pool({
      host: host,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // 10 seconds
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
  }
  return pool
}

export async function query(text, params) {
  const pool = getPool()
  let retries = 3
  while (retries > 0) {
    try {
      const res = await pool.query(text, params)
      return res
    } catch (error) {
      retries--
      if (error.code === 'ECONNRESET' || error.message.includes('Connection terminated')) {
        if (retries > 0) {
          console.warn('Database connection error, retrying...', { retries })
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
          continue
        }
      }
      console.error('Database query error', { text, error: error.message, code: error.code })
      throw error
    }
  }
}

export async function getClient() {
  const pool = getPool()
  return await pool.connect()
}
