import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // For MVP development: demo credentials for Hewane School
          const adminEmail = "admin@hewaneschoolofmusic.com";
          const adminPassword = "password123"; // Demo password - change in production

          // Simple demo authentication - replace with database lookup in production
          if (credentials.email === adminEmail && credentials.password === adminPassword) {
            return {
              id: "admin",
              email: adminEmail,
              name: "Hewane Administrator",
              role: "admin",
            };
          }

          return null;
        } catch (error) {
          console.error("[v0] Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export async function requireAuth() {
  const { auth } = await import("@/lib/auth-server");
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
