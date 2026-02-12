import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username }
              ]
            }
          });

          // Check if user exists and has admin role
          if (user && (user.role === 'admin' || user.role === 'super_admin')) {
            // Password check (Plain text for now to match legacy/seed behavior)
            // TODO: Implement bcrypt/argon2 hashing in production
            const isValid = user.password === credentials.password;

            if (isValid) {
              return {
                id: user.id,
                name: user.name || user.username || 'Admin',
                email: user.email || user.username || 'admin@example.com',
                role: user.role,
                permissions: user.permissions ? JSON.parse(user.permissions) : []
              };
            }
          }
        } catch (error) {
          console.error("Auth error:", error);
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as Record<string, unknown>;
        if (typeof t.role === 'string') {
          (session as unknown as { user: { role?: string } }).user.role = t.role;
        }
        if (Array.isArray(t.permissions)) {
          (session as unknown as { user: { permissions?: unknown[] } }).user.permissions = t.permissions as unknown[];
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: "jwt",
  }
};
