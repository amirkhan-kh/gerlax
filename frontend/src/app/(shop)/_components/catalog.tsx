"use client"

import { useMemo, useState } from "react"

import { Icon, type IconName } from "@/components/icon"
import { Pagination } from "@/components/pagination"
import { money, when } from "@/lib/format"
import { productImage } from "@/lib/image"
import type { Product, ProductType, User } from "@/lib/types"

import { CancelModal } from "./cancel-modal"
import { EditModal } from "./edit-modal"
import { OrderModal } from "./order-modal"
import { SellModal } from "./sell-modal"

const PAGE_SIZE = 6

type Group = { key: string; client: string; items: Product[] }

type Actions = {
  canManage: (item: Product) => boolean
  onSell: (item: Product) => void
  onEdit: (item: Product) => void
  onCancel: (item: Product) => void
  onZoom: (src: string) => void
}

export function Catalog({ products, types, me }: { products: Product[]; types: ProductType[]; me: User }) {
  const isAdmin = me.role === "admin"
  const [status, setStatus] = useState("")
  const [owner, setOwner] = useState("")
  const [typeId, setTypeId] = useState("")
  const [model, setModel] = useState("")
  const [orderPage, setOrderPage] = useState(1)
  const [stockPage, setStockPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [selling, setSelling] = useState<Product | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [cancelling, setCancelling] = useState<Product | null>(null)
  const [zoom, setZoom] = useState<string | null>(null)

  const visible = useMemo(() => {
    const query = model.trim().toLowerCase()
    return products.filter((item) => {
      if (owner === "me" && item.created_by_id !== me.id) return false
      if (owner && owner !== "me" && String(item.created_by_id) !== owner) return false
      if (typeId && String(item.type_id) !== typeId) return false
      if (typeId && query && !item.name.toLowerCase().includes(query)) return false
      return true
    })
  }, [products, typeId, model, owner, me.id])

  const groups = useMemo(() => {
    const map = new Map<string, Group>()
    for (const item of visible) {
      if (item.client_name === null) continue
      const key = item.order_id !== null ? `o${item.order_id}` : `p${item.id}`
      const group = map.get(key)
      if (group) group.items.push(item)
      else map.set(key, { key, client: item.client_name, items: [item] })
    }
    return [...map.values()]
  }, [visible])

  const stock = useMemo(() => visible.filter((item) => item.client_name === null), [visible])

  const owners = useMemo(() => {
    const map = new Map<number, string>()
    for (const item of products) {
      if (item.created_by_id !== null && item.created_by_id !== me.id) map.set(item.created_by_id, item.created_by_name)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [products, me.id])

  const showOrders = status !== "stock" && groups.length > 0
  const showStock = status !== "order" && stock.length > 0
  const orderPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE))
  const stockPages = Math.max(1, Math.ceil(stock.length / PAGE_SIZE))
  const orderCurrent = Math.min(orderPage, orderPages)
  const stockCurrent = Math.min(stockPage, stockPages)

  function resetPages() {
    setOrderPage(1)
    setStockPage(1)
  }

  const actions: Actions = {
    canManage: (item) => isAdmin || item.created_by_id === me.id,
    onSell: setSelling,
    onEdit: setEditing,
    onCancel: setCancelling,
    onZoom: setZoom,
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-white/70">
          Holat
          <select
            className="field mt-1"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              resetPages()
            }}
          >
            <option value="">Barchasi</option>
            <option value="order">Sotuv uchun</option>
            <option value="stock">Ombor uchun</option>
          </select>
        </label>
        <label className="block text-sm text-white/70">
          Tovar turi
          <select
            className="field mt-1"
            value={typeId}
            onChange={(event) => {
              setTypeId(event.target.value)
              setModel("")
              resetPages()
            }}
          >
            <option value="">Barchasi</option>
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-white/70">
          Xodim
          <select
            className="field mt-1"
            value={owner}
            onChange={(event) => {
              setOwner(event.target.value)
              resetPages()
            }}
          >
            <option value="">Barcha xodimlar</option>
            <option value="me">Mening tovarlarim</option>
            {owners.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {typeId ? (
        <label className="mt-3 block text-sm text-white/70">
          Model nomi
          <input
            className="field mt-1"
            value={model}
            placeholder="Masalan Hoco yoki Mi"
            onChange={(event) => {
              setModel(event.target.value)
              resetPages()
            }}
          />
        </label>
      ) : null}

      {!showOrders && !showStock ? <p className="mt-8 text-center text-white/55">Tovar topilmadi</p> : null}

      {showOrders ? (
        <section className="mt-5">
          <SectionTitle title="Sotuv uchun" hint={`${groups.length} ta buyurtma`} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.slice((orderCurrent - 1) * PAGE_SIZE, orderCurrent * PAGE_SIZE).map((group) => (
              <OrderCard key={group.key} group={group} actions={actions} />
            ))}
          </div>
          <Pagination pages={orderPages} current={orderCurrent} onChange={setOrderPage} />
        </section>
      ) : null}

      {showStock ? (
        <section className="mt-6">
          <SectionTitle title="Ombor uchun" hint={`${stock.length} ta tovar`} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {stock.slice((stockCurrent - 1) * PAGE_SIZE, stockCurrent * PAGE_SIZE).map((item) => (
              <StockCard key={item.id} item={item} actions={actions} />
            ))}
          </div>
          <Pagination pages={stockPages} current={stockCurrent} onChange={setStockPage} />
        </section>
      ) : null}

      <button
        className="fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#c6f135] text-3xl text-[#14120e] shadow-[0_10px_30px_rgba(198,241,53,0.35)]"
        type="button"
        aria-label="Yangi buyurtma"
        onClick={() => setAdding(true)}
      >
        +
      </button>

      {adding ? <OrderModal types={types} isAdmin={isAdmin} onClose={() => setAdding(false)} /> : null}
      {selling ? <SellModal product={selling} onClose={() => setSelling(null)} /> : null}
      {cancelling ? <CancelModal product={cancelling} onClose={() => setCancelling(null)} /> : null}
      {editing ? (
        <EditModal
          product={editing}
          siblings={editing.order_id === null ? 1 : products.filter((item) => item.order_id === editing.order_id).length}
          types={types}
          isAdmin={isAdmin}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {zoom ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          <img className="max-h-[85vh] max-w-full rounded-2xl object-contain" src={zoom} alt="" />
        </div>
      ) : null}
    </div>
  )
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-xs text-white/50">{hint}</span>
    </div>
  )
}

function OrderCard({ group, actions }: { group: Group; actions: Actions }) {
  const first = group.items[0]
  const total = group.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const pieces = group.items.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <article className="card flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45 sm:text-[11px]">Klient</p>
          <h3 className="truncate text-base font-semibold sm:text-lg">{group.client}</h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Sotuv uchun
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-white/60">
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5" title="Yetkazib berish vaqti">
          <Icon name="clock" className="h-3 w-3" />
          {when(first.delivery_at)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5">
          <Icon name="box" className="h-3 w-3" />
          {group.items.length} xil · {pieces} dona
        </span>
      </div>
      <ul className="rounded-xl border border-white/10">
        {group.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 border-b border-white/10 p-2.5 last:border-0">
            <div className="flex gap-3">
              <Thumb item={item} onZoom={actions.onZoom} className="h-16 w-16 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">{item.type_name}</p>
                <p className="break-words text-sm font-semibold leading-snug">{item.name}</p>
                <p className="mt-0.5 text-xs text-white/55">
                  {item.quantity} dona × {money(item.price)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[#c6f135]">{money(item.price * item.quantity)}</p>
            </div>
            <ItemButtons item={item} actions={actions} />
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-2.5">
        <Info icon="pin" label="Manzil" value={shortAddress(first.address)} title={first.address} />
        <Info icon="pen" label="Kiritgan" value={first.created_by_name} />
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-white/45 sm:text-[11px]">Jami</p>
          <p className="text-lg font-semibold text-[#c6f135]">{money(total)}</p>
        </div>
        <MapLink address={first.address} />
      </div>
    </article>
  )
}

function StockCard({ item, actions }: { item: Product; actions: Actions }) {
  return (
    <article className="card flex flex-col gap-3 p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45 sm:text-[11px]">{item.type_name}</p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Ombor uchun
        </span>
      </div>
      <Thumb item={item} onZoom={actions.onZoom} className="aspect-square w-full rounded-xl" contain />
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <h3 className="min-w-0 break-words text-sm font-semibold leading-snug sm:text-base">{item.name}</h3>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/60 sm:text-[11px]"
            title="Yetkazib berish vaqti"
          >
            <Icon name="clock" className="h-3 w-3" />
            {when(item.delivery_at)}
          </span>
        </div>
        <p className="text-base font-semibold text-[#c6f135] sm:text-lg">{money(item.price)}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-2.5 border-t border-white/10 pt-3">
        <Info icon="box" label="Soni" value={`${item.quantity} dona`} />
        <Info icon="tag" label="Jami" value={money(item.price * item.quantity)} />
        <Info icon="pen" label="Kiritgan" value={item.created_by_name} />
        <Info icon="pin" label="Manzil" value={shortAddress(item.address)} title={item.address} />
      </dl>
      <div className="mt-auto flex flex-col gap-2">
        <SellButton item={item} actions={actions} />
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <MapLink address={item.address} />
          </div>
          <ManageButtons item={item} actions={actions} />
        </div>
      </div>
    </article>
  )
}

function ItemButtons({ item, actions }: { item: Product; actions: Actions }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1">
        <SellButton item={item} actions={actions} />
      </div>
      <ManageButtons item={item} actions={actions} />
    </div>
  )
}

function SellButton({ item, actions }: { item: Product; actions: Actions }) {
  return (
    <button className="btn flex w-full items-center justify-center gap-1.5 py-2 text-sm" type="button" onClick={() => actions.onSell(item)}>
      <Icon name="check" className="h-4 w-4" />
      Sotildi
    </button>
  )
}

function ManageButtons({ item, actions }: { item: Product; actions: Actions }) {
  if (!actions.canManage(item)) return null
  return (
    <>
      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80"
        type="button"
        aria-label="Tahrirlash"
        title="Tahrirlash"
        onClick={() => actions.onEdit(item)}
      >
        <Icon name="pen" className="h-4 w-4" />
      </button>
      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/30 text-red-400"
        type="button"
        aria-label="Bekor qilish"
        title="Bekor qilish"
        onClick={() => actions.onCancel(item)}
      >
        <Icon name="ban" className="h-4 w-4" />
      </button>
    </>
  )
}

function Thumb({
  item,
  onZoom,
  className,
  contain,
}: {
  item: Product
  onZoom: (src: string) => void
  className: string
  contain?: boolean
}) {
  const src = productImage(item)
  if (!src) {
    return (
      <div className={`flex shrink-0 items-center justify-center bg-black/25 text-white/45 ${className}`}>
        <Icon name="image" className="h-6 w-6" />
      </div>
    )
  }
  return (
    <button className={`shrink-0 overflow-hidden bg-black/25 ${className}`} type="button" aria-label="Rasmni kattalashtirish" onClick={() => onZoom(src)}>
      <img className={`h-full w-full ${contain ? "object-contain" : "object-cover"}`} src={src} alt="" loading="lazy" decoding="async" />
    </button>
  )
}

function MapLink({ address }: { address: string }) {
  return (
    <a
      className="btn-ghost flex items-center justify-center gap-1.5 py-2 text-sm"
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name="map" className="h-4 w-4" />
      Manzil
    </a>
  )
}

function shortAddress(address: string) {
  return address.split(/[\s,]+/).filter(Boolean).slice(0, 2).join(" ")
}

function Info({ icon, label, value, title }: { icon: IconName; label: string; value: string; title?: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-white/45 sm:text-[11px]">
        <Icon name={icon} className="h-3 w-3 shrink-0" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm text-white/85" title={title ?? value}>
        {value}
      </dd>
    </div>
  )
}
