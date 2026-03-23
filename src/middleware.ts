import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

  if (isAuthRoute || isApiRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    const role = (req.auth?.user as { role?: string })?.role;
    // Crew users go to /my-scripts, others go to dashboard
    const target = role === "crew" ? "/my-scripts" : "/";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Role-based route protection for crew users
  if (isLoggedIn) {
    const role = (req.auth?.user as { role?: string })?.role;
    if (role === "crew") {
      const pathname = req.nextUrl.pathname;
      const allowedPaths = ["/my-scripts", "/schedule"];
      const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

      // Redirect crew from root to /my-scripts
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/my-scripts", req.url));
      }

      if (!isAllowed) {
        return NextResponse.redirect(new URL("/my-scripts", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
