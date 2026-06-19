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

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Hewane Admin'

  if (!email || !password) {
    console.log('Skipping admin seed (set ADMIN_EMAIL and ADMIN_PASSWORD to create the first user).')
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
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exist')) {
      console.log('Admin user already exists — skipping seed.')
      return
    }
    throw error
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
