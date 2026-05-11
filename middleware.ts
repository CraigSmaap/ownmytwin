import NextAuth       from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const TALENT_ONLY = ["/twin", "/memories", "/reply", "/chat", "/licensing", "/requests"];
const BUYER_ONLY  = ["/my-requests"];

export default auth((req) => {
  const isLoggedIn   = !!req.auth;
  const { pathname } = req.nextUrl;
  const accountType  = (req.auth?.user as { accountType?: string })?.accountType ?? "talent";
  const isBuyer      = accountType === "buyer";

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/twin") ||
    pathname.startsWith("/memories") ||
    pathname.startsWith("/reply") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/licensing") ||
    pathname.startsWith("/onboarding") ||

    pathname.startsWith("/admin") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/my-requests") ||
    pathname.startsWith("/marketplace");

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 2FA gate — block access until TOTP is verified
  const tf = req.auth?.user as { twoFactorEnabled?: boolean; twoFactorVerified?: boolean } | undefined;
  if (isLoggedIn && tf?.twoFactorEnabled && !tf?.twoFactorVerified && pathname !== "/verify-2fa") {
    return NextResponse.redirect(new URL("/verify-2fa", req.nextUrl));
  }

  if (isLoggedIn && isBuyer && TALENT_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isLoggedIn && !isBuyer && BUYER_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
