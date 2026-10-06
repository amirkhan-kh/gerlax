"use client"

import { useMemo, useState } from "react"

import { returnSale } from "@/actions/shop"
import { Choice } from "@/components/choice"
import { Icon } from "@/components/icon"
import { Pagination } from "@/components/pagination"
import { money, when } from "@/lib/format"
import type { Sale, User } from "@/lib/types"

import { printReceipt } from "./print-receipt"

const PAYMENT: Record<string, string> = {
  full: "To'liq",
  partial: "Qisman (nasiya)",
  cash: "Naqd",
}

const PAGE_SIZE = 6

export function SalesList({ sales, me }: { sales: Sale[]; me: User }) {
  const [page, setPage] = useState(1)
  const [seller, setSeller] = useState("")
  const [status, setStatus] = useState("")
  const [returning, setReturning] = useState<Sale | null>(null)
  const [condition, setCondition] = useState("ok")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const sellers = useMemo(() => {
    const map = new Map<number, string>()
    for (const sale of sales) {
      if (sale.sold_by_id !== null && sale.sold_by_id !== me.id) map.set(sale.sold_by_id, sale.sold_by_name)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [sales, me.id])

  const visible = sales.filter((sale) => {
    if (seller === "me" && sale.sold_by_id !== me.id) return false
    if (seller && seller !== "me" && String(sale.sold_by_id) !== seller) return false
    if (status && sale.status !== status) return false
    return true
  })
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  async function onReturn(formData: FormData) {
    setPending(true)
    const result = await returnSale(formData)
    setPending(false)
    if ("error" in result) {
      setError(result.error ?? "Xatolik yuz berdi")
      return
    }
    setReturning(null)
    setError("")
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-white/70">
          Xodim
          <select
            className="field mt-1"
            value={seller}
            onChange={(event) => {
              setSeller(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Barcha xodimlar</option>
            <option value="me">Mening sotuvlarim</option>
            {sellers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-white/70">
          Holat
          <select
            className="field mt-1"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Barchasi</option>
            <option value="sold">Sotilgan</option>
            <option value="returned">Qaytarilgan</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? <p className="mt-8 text-center text-white/55">Sotuv topilmadi</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((sale) => (
          <article key={sale.id} className="card flex flex-col gap-3 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">{sale.type_name}</p>
              {sale.status === "returned" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Qaytarildi
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Sotilgan
                </span>
              )}
            </div>
            <div>
              <h2 className="break-words font-semibold leading-snug">{sale.product_name}</h2>
              <p className="text-lg font-semibold text-[#c6f135]">{money(sale.price)}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-2.5 border-t border-white/10 pt-3">
              <Row label="To'lov" value={PAYMENT[sale.payment_kind] ?? sale.payment_kind} />
              <Row label="To'langan" value={money(sale.paid_amount)} />
              <Row label="Sotuvchi" value={sale.sold_by_name} />
              <Row label="Sana" value={when(sale.sold_at)} />
              {sale.debt_amount > 0 ? <Row label="Nasiya" value={money(sale.debt_amount)} danger /> : null}
            </dl>
            {me.role === "admin" ? (
              <button className="btn-ghost py-2 text-sm" type="button" onClick={() => printReceipt(sale)}>
                Chek chiqarish
              </button>
            ) : null}
            {sale.status === "returned" ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm">
                <p className="font-semibold text-red-400">
                  {money(sale.refund_amount)} qaytarildi ·{" "}
                  {sale.return_condition === "defect" ? "Nuqsonli, arxivda" : "Yaroqli, sotuvga qaytdi"}
                </p>
                <p className="mt-1 text-white/70">{sale.return_reason}</p>
                <p className="mt-1 text-xs text-white/50">
                  {sale.returned_by_name} · {sale.returned_at ? when(sale.returned_at) : ""}
                </p>
              </div>
            ) : me.role === "admin" || sale.sold_by_id === me.id ? (
              <button
                className="btn-ghost mt-auto flex items-center justify-center gap-1.5 py-2 text-sm"
                type="button"
                onClick={() => {
                  setReturning(sale)
                  setCondition("ok")
                  setError("")
                }}
              >
                <Icon name="undo" className="h-4 w-4" />
                Qaytarish
              </button>
            ) : null}
          </article>
        ))}
      </div>

      <Pagination pages={pages} current={current} onChange={setPage} />

      {returning ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setReturning(null)}>
          <form
            className="glass max-h-[90vh] w-full max-w-md overflow-auto p-5"
            action={onReturn}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Qaytarish</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none text-white/70 hover:text-white"
                type="button"
                aria-label="Yopish"
                onClick={() => setReturning(null)}
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-white/70">
              {returning.product_name} · <span className="text-[#c6f135]">{money(returning.price)}</span>
            </p>
            <div className="mt-3 rounded-xl border border-white/10 p-3 text-sm">
              <p>
                Mijozga qaytariladi: <span className="font-semibold">{money(returning.paid_amount)}</span>
              </p>
              {returning.debt_amount > 0 ? (
                <p className="mt-1 text-white/60">Qolgan nasiya {money(returning.debt_amount)} yopiladi.</p>
              ) : null}
            </div>
            <input type="hidden" name="sale_id" value={returning.id} />
            <input type="hidden" name="condition" value={condition} />
            <p className="mt-4 mb-2 text-sm text-white/70">Tovar holati</p>
            <div className="grid gap-2">
              <Choice
                active={condition === "ok"}
                title="Yaroqli"
                text="Tovar “Sotuv uchun” bo'lib ro'yxatga qaytadi."
                onClick={() => setCondition("ok")}
              />
              <Choice
                active={condition === "defect"}
                title="Nuqsonli (brak)"
                text="Tovar Arxivga tushadi va qayta sotilmaydi."
                onClick={() => setCondition("defect")}
              />
            </div>
            <label className="mt-4 block text-sm text-white/70">
              Sabab
              <textarea className="field mt-1 min-h-20 resize-none" name="reason" maxLength={300} required placeholder="Masalan: rangi to'g'ri kelmadi" />
            </label>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <button className="btn mt-4 w-full" type="submit" disabled={pending}>
              Tasdiqlash
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-white/45 sm:text-[11px]">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm ${danger ? "text-amber-500" : "text-white/85"}`}>{value}</dd>
    </div>
  )
}
