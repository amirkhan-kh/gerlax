import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export function backendUrl(path: string): string {
  const base = process.env.VERCEL
    ? "http://189.74.99.174"
    : (process.env.BACKEND_URL ?? process.env.API_URL ?? "http://127.0.0.1:8002")
  return new URL(path.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`).href
}

export function rethrow(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).includes("NEXT_REDIRECT")
  ) {
    throw error
  }
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown }
    if (typeof body.detail === "string") return body.detail
    if (Array.isArray(body.detail)) return "Maydonlarni to'ldiring"
  } catch {
    return "Xatolik yuz berdi"
  }
  return "Xatolik yuz berdi"
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const jar = await cookies()
  const token = jar.get("access_token")?.value
  const headers = new Headers(init?.headers)
  if (init?.body) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const res = await fetch(backendUrl(path), { ...init, headers, cache: "no-store" })
  if (res.status === 401) redirect("/login")
  if (!res.ok) throw new Error(await errorText(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
