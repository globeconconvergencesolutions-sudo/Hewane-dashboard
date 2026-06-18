"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        router.push("/(dashboard)");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("[v0] Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f8f7f4] via-white to-[#ede8e0] px-4 sm:px-6">
      {/* Left decorative element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#E8B825] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute -bottom-40 right-0 w-80 h-80 bg-[#7D3F7E] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#E8B825] to-[#7D3F7E] rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Hewane School</h1>
          <p className="text-lg font-semibold text-[#7D3F7E]">Music Dashboard</p>
          <p className="text-sm text-gray-600 mt-3">Manage your WhatsApp campaigns</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 p-8 mb-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2.5">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
                <Mail className="w-4 h-4 text-[#E8B825]" />
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@hewaneschoolofmusic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8B825] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2.5">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
                <Lock className="w-4 h-4 text-[#E8B825]" />
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8B825] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 font-bold text-xs">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-[#7D3F7E] to-[#E8B825] hover:from-[#6d2f6e] hover:to-[#d8a815] text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-600">
            Need access? Contact your administrator
          </p>
          <p className="text-xs text-gray-500">
            © 2026 Hewane School of Music. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
