"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { api, rethrow } from "@/lib/api"

const API = process.env.API_URL ?? "http://127.0.0.1:8002"

function asError(error: unknown) {
  rethrow(error)
  return { error: error instanceof Error ? error.message : "Xatolik yuz berdi" }
}

function touch() {
  revalidatePath("/")
  revalidatePath("/sales")
  revalidatePath("/admin")
}

async function fail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown }
    if (typeof body.detail === "string") return body.detail
    if (Array.isArray(body.detail)) return "Maydonlarni to'ldiring"
  } catch {
    return "Xatolik yuz berdi"
  }
  return "Xatolik yuz berdi"
}

export async function login(_prev: { error: string } | null, formData: FormData) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: String(formData.get("login") ?? ""),
      password: String(formData.get("password") ?? ""),
    }),
  })
  if (!res.ok) return { error: await fail(res) }
  const data = (await res.json()) as { access_token: string; refresh_token: string }
  const jar = await cookies()
  jar.set("access_token", data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  jar.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  })
  redirect("/")
}

export async function logout() {
  const jar = await cookies()
  jar.delete("access_token")
  jar.delete("refresh_token")
  redirect("/login")
}

export async function createProduct(formData: FormData) {
  const delivery = String(formData.get("delivery_at") ?? "")
  const price = Number(formData.get("price"))
  if (!delivery) return { error: "Yetkazish vaqtini kiriting" }
  if (!Number.isFinite(price) || price <= 0) return { error: "Narxni kiriting" }
  try {
    await api("/api/v1/products", {
      method: "POST",
      body: JSON.stringify({
        type_id: Number(formData.get("type_id")),
        name: String(formData.get("name") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        color: String(formData.get("color") ?? "").trim(),
        price,
        delivery_at: delivery.length === 16 ? `${delivery}:00+05:00` : delivery,
      }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function sellProduct(formData: FormData) {
  const paymentKind = String(formData.get("payment_kind") ?? "")
  const body: { payment_kind: string; paid_amount?: number } = { payment_kind: paymentKind }
  if (paymentKind === "partial") {
    const paid = Number(formData.get("paid_amount"))
    if (!Number.isFinite(paid)) return { error: "To'langan summani kiriting" }
    body.paid_amount = paid
  }
  try {
    await api(`/api/v1/products/${Number(formData.get("product_id"))}/sell`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function createUser(formData: FormData) {
  try {
    await api("/api/v1/users", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        login: String(formData.get("login") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? ""),
      }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function updateUser(formData: FormData) {
  const password = String(formData.get("password") ?? "")
  try {
    await api(`/api/v1/users/${Number(formData.get("id"))}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        login: String(formData.get("login") ?? "").trim(),
        password: password || null,
        role: String(formData.get("role") ?? ""),
      }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function deleteUser(formData: FormData) {
  try {
    await api(`/api/v1/users/${Number(formData.get("id"))}`, { method: "DELETE" })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function createType(formData: FormData) {
  try {
    await api("/api/v1/products/types", {
      method: "POST",
      body: JSON.stringify({ name: String(formData.get("name") ?? "").trim() }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}
