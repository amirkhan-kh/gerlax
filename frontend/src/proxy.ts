import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  const login = request.nextUrl.pathname.startsWith("/login")
  if (!token && !login) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (token && login) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
