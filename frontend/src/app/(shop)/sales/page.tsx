import { api, getMe, rethrow } from "@/lib/api"
import type { Sale } from "@/lib/types"

import { SalesList } from "./_components/sales-list"

export const dynamic = "force-dynamic"

export default async function SalesPage() {
  try {
    const [sales, me] = await Promise.all([api<Sale[]>("/api/v1/sales"), getMe()])
    return (
      <section>
        <h1 className="mb-4 text-xl font-semibold sm:text-2xl">Sotuvlar</h1>
        <SalesList sales={sales} me={me} />
      </section>
    )
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }
}
