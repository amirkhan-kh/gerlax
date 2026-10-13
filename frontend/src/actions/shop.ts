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
  revalidatePath("/archive")
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

type OrderItem = { type_id: number; name: string; image: string | null; price: number; quantity: number }

type OrderInput = { client_name: string | null; address: string; delivery_at: string; items: OrderItem[] }

type ProductInput = OrderItem & {
  id: number
  remove_image: boolean
  client_name: string | null
  address: string
  delivery_at: string
}

function tashkent(delivery: string) {
  return delivery.length === 16 ? `${delivery}:00+05:00` : delivery
}

function itemError(item: OrderItem) {
  if (!item.type_id) return "Tovar turini tanlang"
  if (!item.name.trim()) return "Tovar nomini kiriting"
  if (!Number.isFinite(item.price) || item.price <= 0) return "Narxni kiriting"
  if (!Number.isInteger(item.quantity) || item.quantity < 1) return "Sonini kiriting"
  if (item.image && !item.image.startsWith("data:image/")) return "Rasm yuklang"
  return null
}

export async function createOrder(input: OrderInput) {
  if (input.items.length === 0) return { error: "Kamida bitta tovar qo'shing" }
  const invalid = input.items.map(itemError).find(Boolean)
  if (invalid) return { error: invalid }
  if (!input.address.trim()) return { error: "Manzilni kiriting" }
  if (!input.delivery_at) return { error: "Yetkazish vaqtini kiriting" }
  try {
    await api("/api/v1/products", {
      method: "POST",
      body: JSON.stringify({
        client_name: input.client_name?.trim() || null,
        address: input.address.trim(),
        delivery_at: tashkent(input.delivery_at),
        items: input.items.map((item) => ({ ...item, name: item.name.trim() })),
      }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function updateProduct(input: ProductInput) {
  const invalid = itemError(input)
  if (invalid) return { error: invalid }
  if (!input.address.trim()) return { error: "Manzilni kiriting" }
  if (!input.delivery_at) return { error: "Yetkazish vaqtini kiriting" }
  try {
    await api(`/api/v1/products/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type_id: input.type_id,
        name: input.name.trim(),
        image: input.image,
        remove_image: input.remove_image,
        price: input.price,
        quantity: input.quantity,
        client_name: input.client_name?.trim() || null,
        address: input.address.trim(),
        delivery_at: tashkent(input.delivery_at),
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
  const quantity = Number(formData.get("quantity") || 0)
  const body: { payment_kind: string; paid_amount?: number; quantity?: number } = { payment_kind: paymentKind }
  if (quantity > 0) body.quantity = quantity
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

export async function cancelProduct(formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim()
  const refund = Number(formData.get("refund_amount") || 0)
  if (!reason) return { error: "Sababini yozing" }
  if (!Number.isFinite(refund) || refund < 0) return { error: "Qaytarilgan summani to'g'ri kiriting" }
  try {
    await api(`/api/v1/products/${Number(formData.get("product_id"))}/cancel`, {
      method: "POST",
      body: JSON.stringify({ action: String(formData.get("action") ?? ""), reason, refund_amount: refund }),
    })
  } catch (error) {
    return asError(error)
  }
  touch()
  return { ok: true as const }
}

export async function returnSale(formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim()
  if (!reason) return { error: "Sababini yozing" }
  try {
    await api(`/api/v1/sales/${Number(formData.get("sale_id"))}/return`, {
      method: "POST",
      body: JSON.stringify({ reason, condition: String(formData.get("condition") ?? "") }),
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
