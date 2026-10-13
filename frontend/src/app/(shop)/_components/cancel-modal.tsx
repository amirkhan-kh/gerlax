"use client"

import { useState } from "react"

import { cancelProduct } from "@/actions/shop"
import { Choice } from "@/components/choice"
import { safe, toast } from "@/components/toast"
import { money } from "@/lib/format"
import type { Product } from "@/lib/types"

import { Modal } from "./modal"

export function CancelModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [action, setAction] = useState(product.client_name ? "stock" : "archive")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const total = product.price * product.quantity

  async function onCancel(formData: FormData) {
    setPending(true)
    const result = await safe(() => cancelProduct(formData))
    setPending(false)
    if ("error" in result) {
      setError(result.error ?? "Xatolik yuz berdi")
      return
    }
    toast(action === "stock" ? `${product.name} omborga o'tkazildi` : `${product.name} bekor qilindi va arxivga tushdi`)
    onClose()
  }

  return (
    <Modal title="Bekor qilish" onClose={onClose}>
      <form action={onCancel}>
        <p className="text-white/70">
          {product.name} · {product.quantity} dona · <span className="text-[#c6f135]">{money(total)}</span>
        </p>
        {product.client_name ? <p className="text-sm text-white/55">Buyurtmachi: {product.client_name}</p> : null}
        <input type="hidden" name="product_id" value={product.id} />
        <input type="hidden" name="action" value={action} />
        <div className="mt-4 grid gap-2">
          {product.client_name ? (
            <Choice
              active={action === "stock"}
              title="Omborga o'tkazish"
              text="Buyurtmachi olib tashlanadi, tovar “Ombor uchun” bo'lib qoladi."
              onClick={() => setAction("stock")}
            />
          ) : null}
          <Choice
            active={action === "archive"}
            title="To'liq bekor qilish"
            text="Tovar ro'yxatdan olinadi va Arxivga tushadi."
            onClick={() => setAction("archive")}
          />
        </div>
        <label className="mt-4 block text-sm text-white/70">
          Sabab
          <textarea
            className="field mt-1 min-h-20 resize-none"
            name="reason"
            maxLength={300}
            required
            placeholder="Masalan: mijoz qo'ng'iroq qilib voz kechdi"
          />
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Qaytarilgan zaklad, so&apos;m (bo&apos;lsa)
          <input className="field mt-1" name="refund_amount" type="number" inputMode="numeric" min={0} max={total} placeholder="0" />
        </label>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button className="btn mt-4 w-full" type="submit" disabled={pending}>
          {pending ? "Saqlanmoqda…" : "Tasdiqlash"}
        </button>
      </form>
    </Modal>
  )
}
