import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Sign In | Hewane School Music Dashboard',
  description: 'Sign in to manage your campaigns',
}

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/')

  return <AuthForm mode="sign-in" />
}
