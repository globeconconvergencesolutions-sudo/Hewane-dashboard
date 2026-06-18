import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Sign Up | Hewane School Music Dashboard',
  description: 'Create an account to manage campaigns',
}

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/')

  return <AuthForm mode="sign-up" />
}
