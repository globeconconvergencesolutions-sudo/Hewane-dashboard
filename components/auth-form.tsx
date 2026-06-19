'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Lock, User, Sparkles } from 'lucide-react'
const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1511379938545-c1f69419868d?auto=format&fit=crop&w=1400&q=80'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(
        error.message ??
          'Unable to sign in. Check your email/password and ensure the database is running.'
      )
      return
    }

    const callbackUrl = searchParams.get('callbackUrl') || '/'
    router.push(callbackUrl.startsWith('/') ? callbackUrl : '/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] lg:grid lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={AUTH_IMAGE}
          alt="Musicians collaborating in a studio"
          fill
          priority
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/90 via-[#7D3F7E]/75 to-[#1a1a2e]/85" />
        <div className="absolute inset-0 bg-[url('/auth-pattern.svg')] bg-cover opacity-30 mix-blend-soft-light" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/95 p-2">
              <Image
                src="/icon.svg"
                alt="Hewane School of Music"
                width={140}
                height={78}
                className="h-10 w-auto object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#E8B825]">
              <Sparkles className="size-3.5" />
              Campaign Control Center
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Reach your community with clarity, care, and rhythm.
            </h2>
            <p className="text-base text-white/75">
              Manage contacts, launch WhatsApp broadcasts, track delivery, and keep your Google
              Sheets in sync — all from one modern workspace.
            </p>
          </div>

          <p className="text-sm text-white/50">Secure access for authorized Hewane staff only.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark variant="auth" />
          </div>
          <Card className="rounded-2xl border-border/80 shadow-xl shadow-black/5">
            <CardContent className="p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isSignUp
                    ? 'Set up access to manage Hewane campaigns and contacts.'
                    : 'Sign in to continue to your dashboard.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                      <User className="size-4 text-primary" />
                      Full name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      className="h-10"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="size-4 text-primary" />
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="admin@hewaneschoolofmusic.com"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="size-4 text-primary" />
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    className="h-10"
                  />
                  {isSignUp ? (
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  ) : null}
                </div>

                {error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" disabled={loading} className="h-10 w-full">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </span>
                  ) : isSignUp ? (
                    'Create account'
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <p className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Link
                  href={isSignUp ? '/sign-in' : '/sign-up'}
                  className="font-semibold text-primary hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
