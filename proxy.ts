import { NextRequest, NextResponse } from "next/server"
import { verifyResultToken } from "@/lib/result-token"

/**
 * Proxy (Next.js 16 "middleware") that guards the /result route.
 *
 * The page is only accessible after a successful payment, which sets a
 * signed `result_token` cookie via POST /api/generate-result.
 *
 * Any direct navigation (typing the URL, sharing a link, manipulating
 * query params) without a valid cookie is redirected to the home page.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/result")) {
    const token = req.cookies.get("result_token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    const data = await verifyResultToken(token)
    if (!data) {
      // Token is malformed or tampered — delete and bounce back home.
      const response = NextResponse.redirect(new URL("/", req.url))
      response.cookies.set("result_token", "", { path: "/result", maxAge: 0 })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/result/:path*"],
}
