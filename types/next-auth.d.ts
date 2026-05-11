import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:                string;
      accountType?:      string;
      twoFactorEnabled?: boolean;
      twoFactorVerified?: boolean;
    } & DefaultSession["user"];
  }
}
