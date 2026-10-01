import { api, rethrow } from "@/lib/api"
import { money, when } from "@/lib/format"
import type { Sale } from "@/lib/types"

export const dynamic = "force-dynamic"

const PAYMENT: Record<string, string> = {
  full: "To'liq",
  partial: "Qisman",
  cash: "Naqd",
}

export default async function SalesPage() {
  let sales: Sale[]
  try {
    sales = await api<Sale[]>("/api/v1/sales")
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">Sotuvlar</h1>
      {sales.length === 0 ? <p className="text-white/55">Hozircha sotuv yo&apos;q</p> : null}
      <div className="grid gap-3">
        {sales.map((sale) => (
          <article key={sale.id} className="glass p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/45">{sale.type_name}</p>
                <h2 className="text-lg font-semibold">{sale.product_name}</h2>
              </div>
              <p className="text-[#c6f135]">{money(sale.price)}</p>
            </div>
            <p className="mt-2 text-sm text-white/75">
              {PAYMENT[sale.payment_kind] ?? sale.payment_kind}
              {sale.debt_amount > 0 ? ` · nasiya ${money(sale.debt_amount)}` : ""}
            </p>
            <p className="text-sm text-white/55">
              To&apos;langan {money(sale.paid_amount)} · {sale.sold_by_name} · {when(sale.sold_at)}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
