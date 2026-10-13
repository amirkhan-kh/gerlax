"use client"

import { useState } from "react"

import { sellProduct } from "@/actions/shop"
import { safe, toast } from "@/components/toast"
import { money } from "@/lib/format"
import type { Product } from "@/lib/types"

import { Modal } from "./modal"
import { QtyStepper } from "./qty-stepper"

export function SellModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [payment, setPayment] = useState("cash")
  const [quantity, setQuantity] = useState(product.client_name ? product.quantity : 1)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const count = Math.max(1, quantity)
  const total = product.price * count

  async function onSell(formData: FormData) {
    setPending(true)
    const result = await safe(() => sellProduct(formData))
    setPending(false)
    if ("error" in result) {
      setError(result.error ?? "Xatolik yuz berdi")
      return
    }
    toast(`${product.name} — ${count} dona sotildi`)
    onClose()
  }

  return (
    <Modal title="Sotildi" onClose={onClose}>
      <form action={onSell}>
        <p className="text-white/70">{product.name}</p>
        <p className="text-sm text-white/55">
          1 dona: {money(product.price)}
          {product.client_name ? ` · ${product.client_name}` : ""}
        </p>
        <input type="hidden" name="product_id" value={product.id} />
        <input type="hidden" name="quantity" value={count} />
        {product.quantity > 1 ? (
          <div className="mt-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Soni</span>
              <span className="text-white/50">Mavjud: {product.quantity} dona</span>
            </div>
            <div className="mt-1">
              <QtyStepper value={quantity} max={product.quantity} onChange={setQuantity} />
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5">
          <span className="text-sm text-white/70">Jami</span>
          <span className="text-lg font-semibold text-[#c6f135]">{money(total)}</span>
        </div>
        <label className="mt-3 block text-sm text-white/70">
          To&apos;lov
          <select className="field mt-1" name="payment_kind" value={payment} onChange={(event) => setPayment(event.target.value)}>
            <option value="cash">Naqd</option>
            <option value="full">To&apos;liq</option>
            <option value="partial">Qisman (nasiya)</option>
          </select>
        </label>
        {payment === "partial" ? (
          <label className="mt-3 block text-sm text-white/70">
            To&apos;langan summa
            <input className="field mt-1" name="paid_amount" type="number" inputMode="numeric" min={0} max={total - 1} required />
          </label>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button className="btn mt-4 w-full" type="submit" disabled={pending}>
          {pending ? "Saqlanmoqda…" : "Tasdiqlash"}
        </button>
      </form>
    </Modal>
  )
}
