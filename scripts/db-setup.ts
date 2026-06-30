import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(filename: string) {
  const envPath = resolve(process.cwd(), filename)
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    value = value.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const body = (error as { body?: { code?: string } }).body
  return body?.code
}

async function adminUserExists(email: string): Promise<boolean> {
  const { pool } = await import('../lib/db')
  const result = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [email])
  return (result.rowCount ?? 0) > 0
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env.local and set it.')
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET is required. Generate one with: openssl rand -base64 32')
  }

  const { auth } = await import('../lib/auth')

  console.log('Running Better Auth database migrations...')
  const ctx = await auth.$context
  await ctx.runMigrations()
  console.log('Database migrations complete.')

  const { runAppMigrations } = await import('../lib/db/migrate-app')
  console.log('Running app table migrations...')
  await runAppMigrations()
  console.log('App table migrations complete.')

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Hewane Admin'

  if (!email || !password) {
    console.log('Skipping admin seed (set ADMIN_EMAIL and ADMIN_PASSWORD to create the first user).')
    return
  }

  if (await adminUserExists(email)) {
    console.log(`Admin user already exists (${email}) — skipping seed.`)
    return
  }

  if (process.env.DISABLE_SIGNUP === 'true') {
    console.warn(
      `Sign-up is disabled (DISABLE_SIGNUP=true) and no account exists for ${email}.`,
      'Set DISABLE_SIGNUP=false temporarily and run pnpm db:setup again, or create the user manually.',
    )
    return
  }

  console.log(`Seeding admin user ${email}...`)

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })
    console.log(`Admin user ready: ${email}`)
  } catch (error) {
    const message = errorMessage(error)
    const code = errorCode(error)

    if (
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('exist') ||
      code === 'USER_ALREADY_EXISTS'
    ) {
      console.log(`Admin user already exists (${email}) — skipping seed.`)
      return
    }

    if (
      code === 'EMAIL_PASSWORD_SIGN_UP_DISABLED' ||
      message.toLowerCase().includes('sign up is not enabled')
    ) {
      if (await adminUserExists(email)) {
        console.log(`Admin user already exists (${email}) — skipping seed (sign-up disabled in env).`)
        return
      }

      console.warn(
        `Sign-up is disabled and no account exists for ${email}.`,
        'Set DISABLE_SIGNUP=false temporarily and run pnpm db:setup again.',
      )
      return
    }

    throw error
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
