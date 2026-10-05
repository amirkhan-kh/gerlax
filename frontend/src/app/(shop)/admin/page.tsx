import { redirect } from "next/navigation"

import { api, rethrow } from "@/lib/api"
import type { Product, ProductType, Sale, SalesSummary, User, UserStat } from "@/lib/types"

import { AdminPanel } from "./_components/admin-panel"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  try {
    const me = await api<User>("/api/v1/auth/me")
    if (me.role !== "admin") redirect("/")
    const [users, stats, types, products, sales, summary] = await Promise.all([
      api<User[]>("/api/v1/users"),
      api<UserStat[]>("/api/v1/users/stats"),
      api<ProductType[]>("/api/v1/products/types"),
      api<Product[]>("/api/v1/products"),
      api<Sale[]>("/api/v1/sales"),
      api<SalesSummary>("/api/v1/sales/summary"),
    ])
    return (
      <AdminPanel me={me} users={users} stats={stats} types={types} products={products} sales={sales} summary={summary} />
    )
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }
}
