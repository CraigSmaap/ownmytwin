import type { NextAuthConfig } from "next-auth";
import Google      from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Real authorize logic lives in auth.ts (Node.js only).
        // This stub satisfies the edge-safe config requirement.
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub)           session.user.id               = token.sub;
      if (token.accountType)                   session.user.accountType      = token.accountType      as string;
      if (token.twoFactorEnabled  !== undefined) session.user.twoFactorEnabled  = token.twoFactorEnabled  as boolean;
      if (token.twoFactorVerified !== undefined) session.user.twoFactorVerified = token.twoFactorVerified as boolean;
      return session;
    },
  },
  pages: { signIn: "/login" },
};
