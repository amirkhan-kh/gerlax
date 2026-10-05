"use client"

import { useState } from "react"

import { Icon, type IconName } from "@/components/icon"
import { Pagination } from "@/components/pagination"
import { money, when } from "@/lib/format"
import type { ArchivedProduct } from "@/lib/types"

const PAGE_SIZE = 6

const OUTCOME: Record<"sold" | "cancelled" | "defect", { label: string; icon: IconName; badge: string; accent: string }> = {
  sold: { label: "Sotildi", icon: "check", badge: "bg-emerald-500/15 text-emerald-500", accent: "bg-emerald-500" },
  cancelled: { label: "Bekor qilindi", icon: "ban", badge: "bg-red-500/15 text-red-400", accent: "bg-red-500" },
  defect: { label: "Brak", icon: "undo", badge: "bg-amber-500/15 text-amber-500", accent: "bg-amber-500" },
}

export function ArchiveList({ items }: { items: ArchivedProduct[] }) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  if (items.length === 0) return <p className="mt-8 text-center text-white/55">Arxiv bo&apos;sh</p>

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => {
          const outcome = OUTCOME[item.status === "sold" ? "sold" : (item.archive_kind ?? "cancelled")]
          return (
            <article key={item.id} className="card relative flex gap-3 overflow-hidden p-3 pl-4">
              <span className={`absolute inset-y-0 left-0 w-1 ${outcome.accent}`} />
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/25">
                {item.image ? (
                  <img className="h-full w-full object-contain" src={item.image} alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/25">
                    <Icon name="image" className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">{item.type_name}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${outcome.badge}`}>
                    <Icon name={outcome.icon} className="h-3 w-3" />
                    {outcome.label}
                  </span>
                </div>
                <h2 className="truncate font-semibold">{item.name}</h2>
                <p className="text-sm font-semibold text-[#c6f135]">{money(item.price)}</p>
                <p className="truncate text-xs text-white/55">Kiritgan: {item.created_by_name}</p>
                {item.client_name ? <p className="truncate text-xs text-white/55">Buyurtmachi: {item.client_name}</p> : null}
                {item.status === "sold" ? (
                  <>
                    {item.paid_amount !== null ? (
                      <p className="text-xs text-white/55">To&apos;langan: {money(item.paid_amount)}</p>
                    ) : null}
                    <p className="mt-auto text-xs text-white/45">
                      {item.sold_by_name} sotdi · {item.sold_at ? when(item.sold_at) : ""}
                    </p>
                  </>
                ) : (
                  <>
                    {item.archive_reason ? <p className="line-clamp-2 text-sm text-white/70">{item.archive_reason}</p> : null}
                    {item.refund_amount > 0 ? (
                      <p className="text-xs text-white/55">Qaytarilgan: {money(item.refund_amount)}</p>
                    ) : null}
                    <p className="mt-auto text-xs text-white/45">
                      {item.archived_by_name} · {item.archived_at ? when(item.archived_at) : ""}
                    </p>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <Pagination pages={pages} current={current} onChange={setPage} />
    </div>
  )
}
