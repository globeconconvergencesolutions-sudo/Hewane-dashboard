'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Music, Mail, Lock, User } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
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
      setError(error.message ?? 'Something went wrong')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f7f4] via-white to-[#ede8e0] flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#E8B825] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute -bottom-40 right-0 w-80 h-80 bg-[#7D3F7E] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {!isSignUp && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E8B825] to-[#7D3F7E] rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Hewane School</h1>
            <p className="text-lg font-semibold text-[#7D3F7E]">Music Dashboard</p>
          </div>
        )}

        <Card className="w-full rounded-2xl shadow-xl shadow-black/5 p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {isSignUp ? 'Join Hewane School to manage campaigns' : 'Sign in to your account to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2.5">
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
                  <User className="w-4 h-4 text-[#E8B825]" />
                  Full Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="John Doe"
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8B825] focus:border-transparent transition-all"
                />
              </div>
            )}
            <div className="space-y-2.5">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
                <Mail className="w-4 h-4 text-[#E8B825]" />
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8B825] focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
                <Lock className="w-4 h-4 text-[#E8B825]" />
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
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8B825] focus:border-transparent transition-all"
              />
              {isSignUp && <p className="text-xs text-gray-500">Minimum 8 characters</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 font-bold text-xs">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-6 bg-gradient-to-r from-[#7D3F7E] to-[#E8B825] hover:from-[#6d2f6e] hover:to-[#d8a815] text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isSignUp ? 'Creating...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Link
                href={isSignUp ? '/sign-in' : '/sign-up'}
                className="text-[#7D3F7E] font-semibold hover:text-[#E8B825] transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}
