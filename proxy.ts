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
    const cookieToken = req.cookies.get("result_token")?.value
    const urlToken    = req.nextUrl.searchParams.get("token") ?? undefined
    const token       = cookieToken ?? urlToken

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    const data = await verifyResultToken(token)
    if (!data) {
      const response = NextResponse.redirect(new URL("/", req.url))
      if (cookieToken) response.cookies.set("result_token", "", { path: "/result", maxAge: 0 })
      return response
    }

    // Token veio via URL (link do e-mail): define o cookie e redireciona
    // para a URL limpa (sem ?token=) para que a página Server Component o leia.
    if (!cookieToken && urlToken) {
      const response = NextResponse.redirect(new URL(pathname, req.url))
      response.cookies.set("result_token", urlToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        path:     "/result",
        maxAge:   60 * 60,
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/result/:path*"],
}
