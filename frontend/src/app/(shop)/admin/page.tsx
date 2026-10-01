import { redirect } from "next/navigation"

import { api, rethrow } from "@/lib/api"
import type { Product, ProductType, Sale, User } from "@/lib/types"

import { AdminPanel } from "./_components/admin-panel"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  try {
    const me = await api<User>("/api/v1/auth/me")
    if (me.role !== "admin") redirect("/")
    const [users, types, products, sales] = await Promise.all([
      api<User[]>("/api/v1/users"),
      api<ProductType[]>("/api/v1/products/types"),
      api<Product[]>("/api/v1/products"),
      api<Sale[]>("/api/v1/sales"),
    ])
    return <AdminPanel me={me} users={users} types={types} products={products} sales={sales} />
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }
}
