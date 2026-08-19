import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "apex-bank-secret-key-change-in-production-2024"
);

const protectedRoutes = ["/dashboard", "/transfer", "/transactions", "/cards", "/settings", "/admin"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("apex-token")?.value;

  let payload: any = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch {
      // Invalid token
    }
  }

  // Redirect to login if accessing protected route without auth
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (authRoutes.some((r) => pathname.startsWith(r)) && payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin route protection — check isAdmin from JWT
  if (pathname.startsWith("/admin") && payload && !payload.isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
