import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyResultToken } from "@/lib/result-token"
import { ResultContent } from "./result-content"

/**
 * Server Component — guards the result page.
 *
 * The middleware already redirects unauthenticated requests, but we
 * re-verify the cookie here as a defence-in-depth measure and to decode
 * the order data that the client component needs as props.
 */
export default async function ResultPage() {
  const cookieStore = await cookies()
  const token       = cookieStore.get("result_token")?.value

  if (!token) redirect("/")

  const data = await verifyResultToken(token)
  if (!data) redirect("/")

  return <ResultContent {...data} />
}
