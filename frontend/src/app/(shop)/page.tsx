import { api, rethrow } from "@/lib/api"
import type { Product, ProductType, User } from "@/lib/types"

import { Catalog } from "./_components/catalog"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  try {
    const [products, types, me] = await Promise.all([
      api<Product[]>("/api/v1/products"),
      api<ProductType[]>("/api/v1/products/types"),
      api<User>("/api/v1/auth/me"),
    ])
    return <Catalog products={products} types={types} isAdmin={me.role === "admin"} />
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }
}
