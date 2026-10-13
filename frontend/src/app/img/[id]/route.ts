import type { NextRequest } from "next/server"

import { backendUrl } from "@/lib/api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = request.cookies.get("access_token")?.value
  if (!token || !/^\d+$/.test(id)) return new Response(null, { status: 404 })
  const res = await fetch(backendUrl(`/api/v1/products/${id}/image`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return new Response(null, { status: res.status === 401 ? 401 : 404 })
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  })
}
