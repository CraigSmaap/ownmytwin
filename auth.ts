import NextAuth      from "next-auth";
import Google        from "next-auth/providers/google";
import Credentials   from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db }        from "@/lib/db";
import { authConfig } from "./auth.config";
import bcrypt        from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter:  PrismaAdapter(db),
  session:  { strategy: "jwt" },
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where:  { email: credentials.email as string },
          select: { id: true, name: true, email: true, image: true, passwordHash: true },
        });

        if (!user) return null;

        // Allow passwordless admin access (passwordHash null = legacy/OAuth account)
        if (user.passwordHash) {
          const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!valid) return null;
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Auto-verify email for OAuth providers — Google already verified it
      if (account?.provider === "google" && user.id) {
        await db.user.update({
          where: { id: user.id },
          data:  { emailVerified: new Date() },
        }).catch(() => {});
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        const dbUser = await db.user.findUnique({
          where:  { id: user.id },
          select: { accountType: true, twoFactorEnabled: true },
        });
        token.accountType       = dbUser?.accountType    ?? "talent";
        token.twoFactorEnabled  = dbUser?.twoFactorEnabled ?? false;
        token.twoFactorVerified = !dbUser?.twoFactorEnabled;
      }
      if (trigger === "update" && session?.twoFactorVerified === true) {
        token.twoFactorVerified = true;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub)      session.user.id          = token.sub;
      if (token.accountType)              session.user.accountType = token.accountType as string;
      return session;
    },
  },
});
