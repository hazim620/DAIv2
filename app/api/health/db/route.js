import { query, getPool } from '@/lib/postgres'

export async function GET() {
  try {
    const host = process.env.DB_HOST || '(default from lib/postgres.js)'
    const port = process.env.DB_PORT || '(default 5432)'
    const database = process.env.DB_NAME || '(default postgres)'
    const user = process.env.DB_USER || '(default postgres)'
    const sslEnv = process.env.DB_SSL

    // Attempt a simple query
    const res = await query('SELECT 1 AS ok')

    // Also show whether pool thinks SSL is enabled (best-effort)
    let sslEnabled = null
    try {
      const pool = getPool()
      sslEnabled = !!pool?.options?.ssl
    } catch (e) {
      // ignore
    }

    return Response.json({
      ok: true,
      db: {
        host,
        port,
        database,
        user,
        sslEnv,
        sslEnabled,
      },
      result: res?.rows?.[0] || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: {
          message: error?.message || 'Unknown error',
          code: error?.code || null,
        },
        db: {
          host: process.env.DB_HOST || null,
          port: process.env.DB_PORT || null,
          database: process.env.DB_NAME || null,
          user: process.env.DB_USER || null,
          sslEnv: process.env.DB_SSL || null,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

