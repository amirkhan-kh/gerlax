"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { api, backendUrl, rethrow } from "@/lib/api"

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
  const res = await fetch(backendUrl("/api/v1/auth/login"), {
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
  const image = String(formData.get("image") ?? "")
  if (!delivery) return { error: "Yetkazish vaqtini kiriting" }
  if (!Number.isFinite(price) || price <= 0) return { error: "Narxni kiriting" }
  if (!String(formData.get("name") ?? "").trim()) return { error: "Tovar nomini kiriting" }
  if (!String(formData.get("address") ?? "").trim()) return { error: "Manzilni kiriting" }
  if (!String(formData.get("color") ?? "").trim()) return { error: "Rangni kiriting" }
  if (!formData.get("type_id")) return { error: "Tovar turini tanlang" }
  if (image && !image.startsWith("data:image/")) return { error: "Rasm yuklang" }
  const stock = formData.get("stock") === "on"
  const client = String(formData.get("client_name") ?? "").trim()
  if (!stock && !client) return { error: "Klient ismini kiriting" }
  try {
    await api("/api/v1/products", {
      method: "POST",
      body: JSON.stringify({
        type_id: Number(formData.get("type_id")),
        name: String(formData.get("name") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        image: image || null,
        client_name: stock ? null : client,
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

export async function reverseAddress(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=uz`
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Gerlax/1.0" }, cache: "no-store" })
    if (!res.ok) return { error: "Manzil topilmadi" }
    const data = (await res.json()) as { display_name?: string }
    const address = data.display_name?.trim().slice(0, 300)
    if (!address) return { error: "Manzil topilmadi" }
    return { address }
  } catch {
    return { error: "Manzil topilmadi" }
  }
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

export async function updateProfile(formData: FormData) {
  const avatar = formData.get("avatar")
  if (typeof avatar === "string" && avatar && !avatar.startsWith("data:image/")) return { error: "Rasm yuklang" }
  try {
    await api("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        avatar: typeof avatar === "string" ? avatar : null,
      }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  revalidatePath("/profile")
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
