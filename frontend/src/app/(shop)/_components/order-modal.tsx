"use client"

import { useState } from "react"

import { createOrder } from "@/actions/shop"
import { Icon } from "@/components/icon"
import { safe, toast } from "@/components/toast"
import { money } from "@/lib/format"
import type { ProductType } from "@/lib/types"

import { AddressField } from "./address-field"
import { EMPTY_DRAFT, ItemFields, draftError, type Draft } from "./item-fields"
import { Modal } from "./modal"

type CartItem = Draft & { key: number; typeName: string }

const MAX_PHOTOS_SIZE = 3_500_000

let nextKey = 0

export function OrderModal({ types, isAdmin, onClose }: { types: ProductType[]; isAdmin: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"items" | "client">("items")
  const [cart, setCart] = useState<CartItem[]>([])
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [stock, setStock] = useState(false)
  const [client, setClient] = useState("")
  const [address, setAddress] = useState("")
  const [delivery, setDelivery] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const dirty = Boolean(draft.typeId || draft.name.trim() || draft.price || draft.photo)
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const pieces = cart.reduce((sum, item) => sum + item.quantity, 0)

  function pushDraft(): CartItem[] | null {
    const problem = draftError(draft) ?? (!draft.noImage && !draft.photo ? "Rasm yuklang yoki “Rasmsiz” ni belgilang" : null)
    if (problem) {
      setError(problem)
      return null
    }
    const typeName = types.find((item) => String(item.id) === draft.typeId)?.name ?? ""
    const next = [...cart, { ...draft, key: ++nextKey, typeName }]
    setCart(next)
    setDraft(EMPTY_DRAFT)
    setError("")
    return next
  }

  function addMore() {
    const next = pushDraft()
    if (next) toast(`${next[next.length - 1].name} savatga qo'shildi`)
  }

  function proceed() {
    let next = cart
    if (dirty || cart.length === 0) {
      const pushed = pushDraft()
      if (!pushed) return
      next = pushed
    }
    if (next.length > 0) setStep("client")
  }

  function editItem(item: CartItem) {
    if (dirty) {
      setError("Avval joriy tovarni savatga qo'shing")
      return
    }
    setCart(cart.filter((row) => row.key !== item.key))
    setDraft(item)
    setStep("items")
    setError("")
  }

  function removeItem(item: CartItem) {
    const next = cart.filter((row) => row.key !== item.key)
    setCart(next)
    if (next.length === 0) setStep("items")
  }

  async function submit() {
    if (!stock && !client.trim()) return setError("Klient ismini kiriting")
    if (!address.trim()) return setError("Manzilni kiriting")
    if (!delivery) return setError("Yetkazish vaqtini kiriting")
    if (cart.reduce((sum, item) => sum + (item.photo?.length ?? 0), 0) > MAX_PHOTOS_SIZE) {
      return setError("Rasmlar hajmi juda katta. Buyurtmani ikkiga bo'ling")
    }
    setPending(true)
    const result = await safe(() =>
      createOrder({
        client_name: stock ? null : client,
        address,
        delivery_at: delivery,
        items: cart.map((item) => ({
          type_id: Number(item.typeId),
          name: item.name,
          image: item.photo,
          price: Number(item.price),
          quantity: item.quantity,
        })),
      }),
    )
    setPending(false)
    if ("error" in result) {
      setError(result.error ?? "Xatolik yuz berdi")
      return
    }
    toast(stock ? `Omborga ${cart.length} xil tovar qo'shildi` : `${client.trim()} uchun ${cart.length} xil tovar qo'shildi`)
    onClose()
  }

  return (
    <Modal title="Yangi buyurtma" onClose={onClose}>
      <ol className="mb-4 grid grid-cols-2 gap-2 text-xs font-semibold">
        {[
          { id: "items", label: "1. Tovarlar" },
          { id: "client", label: "2. Klient va tasdiq" },
        ].map((item) => (
          <li
            key={item.id}
            className={`rounded-full border px-3 py-1.5 text-center ${
              step === item.id ? "border-[#c6f135] text-[#c6f135]" : "border-white/10 text-white/50"
            }`}
          >
            {item.label}
          </li>
        ))}
      </ol>

      {cart.length > 0 ? (
        <div className="mb-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/55">
            <span>
              Savatda {cart.length} xil · {pieces} dona
            </span>
            <span className="font-semibold text-[#c6f135]">{money(total)}</span>
          </div>
          <ul>
            {cart.map((item) => (
              <li key={item.key} className="flex items-center gap-3 border-b border-white/10 px-3 py-2 last:border-0">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black/25">
                  {item.photo ? (
                    <img className="h-full w-full object-cover" src={item.photo} alt="" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/45">
                      <Icon name="image" className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-white/55">
                    {item.typeName} · {item.quantity} × {money(Number(item.price))}
                  </p>
                </div>
                <button
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white"
                  type="button"
                  aria-label="Tahrirlash"
                  onClick={() => editItem(item)}
                >
                  <Icon name="pen" className="h-4 w-4" />
                </button>
                <button
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-red-400"
                  type="button"
                  aria-label="Olib tashlash"
                  onClick={() => removeItem(item)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === "items" ? (
        <>
          <ItemFields
            draft={draft}
            onChange={setDraft}
            types={types}
            preview={draft.photo}
            onPhoto={(photo) => setDraft({ ...draft, photo })}
            onError={setError}
            allowNoImage
          />
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-line" type="button" onClick={addMore}>
              + Yana tovar
            </button>
            <button className="btn" type="button" onClick={proceed}>
              Davom etish
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-white/50">
            Bitta klient bir nechta tovar olsa, “+ Yana tovar” bilan savatga qo&apos;shing
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {isAdmin ? (
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={stock} onChange={(event) => setStock(event.target.checked)} />
              Ombor uchun (klientsiz)
            </label>
          ) : null}
          {stock ? null : (
            <label className="block text-sm text-white/70">
              Klient ismi
              <input className="field mt-1" value={client} maxLength={120} onChange={(event) => setClient(event.target.value)} />
            </label>
          )}
          <AddressField value={address} onChange={setAddress} />
          <label className="block text-sm text-white/70">
            Yetkazib olib kelish vaqti
            <input className="field mt-1" type="datetime-local" value={delivery} onChange={(event) => setDelivery(event.target.value)} />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="mt-1 grid grid-cols-[auto_1fr] gap-2">
            <button className="btn-ghost px-4" type="button" onClick={() => setStep("items")}>
              ← Orqaga
            </button>
            <button className="btn" type="button" disabled={pending} onClick={submit}>
              {pending ? "Saqlanmoqda…" : "Tasdiqlash"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
