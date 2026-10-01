"use client"

import { useMemo, useState } from "react"

import { createProduct, sellProduct } from "@/actions/shop"
import { money, when } from "@/lib/format"
import type { Product, ProductType } from "@/lib/types"

export function Catalog({ products, types }: { products: Product[]; types: ProductType[] }) {
  const [typeId, setTypeId] = useState("")
  const [model, setModel] = useState("")
  const [adding, setAdding] = useState(false)
  const [selling, setSelling] = useState<Product | null>(null)
  const [error, setError] = useState("")
  const [payment, setPayment] = useState("cash")
  const [pending, setPending] = useState(false)

  const visible = useMemo(() => {
    return products.filter((item) => {
      if (typeId && String(item.type_id) !== typeId) return false
      if (typeId && model && !item.name.toLowerCase().includes(model.trim().toLowerCase())) return false
      return true
    })
  }, [products, typeId, model])

  async function onAdd(formData: FormData) {
    setPending(true)
    const result = await createProduct(formData)
    setPending(false)
    if (result && "error" in result) {
      setError(result.error)
      return
    }
    setAdding(false)
    setError("")
  }

  async function onSell(formData: FormData) {
    setPending(true)
    const result = await sellProduct(formData)
    setPending(false)
    if (result && "error" in result) {
      setError(result.error)
      return
    }
    setSelling(null)
    setError("")
    setPayment("cash")
  }

  return (
    <div>
      <label className="block text-sm text-white/70">
        Tovar turi
        <select
          className="field mt-1"
          value={typeId}
          onChange={(event) => {
            setTypeId(event.target.value)
            setModel("")
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

      {typeId ? (
        <label className="mt-3 block text-sm text-white/70">
          Model nomi
          <input
            className="field mt-1"
            value={model}
            placeholder="Masalan Hoco yoki Mi"
            onChange={(event) => setModel(event.target.value)}
          />
        </label>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-white/55">Tovar topilmadi</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {visible.map((item) => (
            <article key={item.id} className="glass flex flex-col gap-1.5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-white/45">{item.type_name}</p>
              <h2 className="text-base font-semibold leading-tight">{item.name}</h2>
              <p className="text-lg font-semibold text-[#c6f135]">{money(item.price)}</p>
              <p className="text-sm text-white/75">{item.color}</p>
              <p className="line-clamp-2 text-sm text-white/60">{item.address}</p>
              <p className="text-xs text-white/45">{when(item.delivery_at)}</p>
              <button
                className="btn-line mt-2"
                type="button"
                onClick={() => {
                  setSelling(item)
                  setError("")
                  setPayment("cash")
                }}
              >
                Sotildi
              </button>
            </article>
          ))}
        </div>
      )}

      <button
        className="fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#c6f135] text-3xl text-[#14120e] shadow-[0_10px_30px_rgba(198,241,53,0.35)]"
        type="button"
        aria-label="Buyurtma"
        onClick={() => {
          setAdding(true)
          setError("")
        }}
      >
        +
      </button>

      {adding ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setAdding(false)}>
          <form
            className="glass max-h-[90vh] w-full max-w-md overflow-auto p-5"
            action={onAdd}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold">Yangi buyurtma</h2>
            <label className="mb-3 block text-sm text-white/70">
              Tovar turi
              <select className="field mt-1" name="type_id" required defaultValue="">
                <option value="" disabled>
                  Tanlang
                </option>
                {types.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mb-3 block text-sm text-white/70">
              Tovar nomi
              <input className="field mt-1" name="name" required />
            </label>
            <label className="mb-3 block text-sm text-white/70">
              Manzil
              <input className="field mt-1" name="address" required />
            </label>
            <label className="mb-3 block text-sm text-white/70">
              Rang
              <input className="field mt-1" name="color" required />
            </label>
            <label className="mb-3 block text-sm text-white/70">
              Narx
              <input className="field mt-1" name="price" type="number" min={1} required />
            </label>
            <label className="mb-3 block text-sm text-white/70">
              Yetkazib olib kelish vaqti
              <input className="field mt-1" name="delivery_at" type="datetime-local" required />
            </label>
            {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
            <button className="btn w-full" type="submit" disabled={pending}>
              Qo&apos;shish
            </button>
          </form>
        </div>
      ) : null}

      {selling ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setSelling(null)}>
          <form
            className="glass w-full max-w-md p-5"
            action={onSell}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Sotildi</h2>
            <p className="mt-1 text-white/70">{selling.name}</p>
            <p className="mb-4 text-[#c6f135]">{money(selling.price)}</p>
            <input type="hidden" name="product_id" value={selling.id} />
            <label className="mb-3 block text-sm text-white/70">
              To&apos;lov
              <select className="field mt-1" name="payment_kind" value={payment} onChange={(event) => setPayment(event.target.value)}>
                <option value="cash">Naqd</option>
                <option value="full">To&apos;liq</option>
                <option value="partial">Qisman (nasiya)</option>
              </select>
            </label>
            {payment === "partial" ? (
              <label className="mb-3 block text-sm text-white/70">
                To&apos;langan summa
                <input className="field mt-1" name="paid_amount" type="number" min={0} required />
              </label>
            ) : null}
            {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
            <button className="btn w-full" type="submit" disabled={pending}>
              Tasdiqlash
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
