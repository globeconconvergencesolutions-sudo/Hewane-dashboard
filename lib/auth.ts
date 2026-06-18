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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // For MVP: simple hardcoded admin check
        // In production, verify against a secure database or LDAP
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminPasswordHash) {
          console.error("[v0] Admin credentials not configured in env");
          throw new Error("Server misconfigured");
        }

        if (credentials.email !== adminEmail) {
          throw new Error("Invalid email or password");
        }

        // Compare password hash
        const isValidPassword = await compare(
          credentials.password as string,
          adminPasswordHash
        );

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: "admin",
          email: adminEmail,
          name: "Admin",
          role: "admin",
        };
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
