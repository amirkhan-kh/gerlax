"use client"

import { useState } from "react"

import { updateProduct } from "@/actions/shop"
import { safe, toast } from "@/components/toast"
import { localInput } from "@/lib/format"
import { productImage } from "@/lib/image"
import type { Product, ProductType } from "@/lib/types"

import { AddressField } from "./address-field"
import { ItemFields, draftError, type Draft } from "./item-fields"
import { Modal } from "./modal"

export function EditModal({
  product,
  siblings,
  types,
  isAdmin,
  onClose,
}: {
  product: Product
  siblings: number
  types: ProductType[]
  isAdmin: boolean
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Draft>({
    typeId: String(product.type_id),
    name: product.name,
    price: String(product.price),
    quantity: product.quantity,
    photo: null,
    noImage: false,
  })
  const [removed, setRemoved] = useState(false)
  const [stock, setStock] = useState(product.client_name === null)
  const [client, setClient] = useState(product.client_name ?? "")
  const [address, setAddress] = useState(product.address)
  const [delivery, setDelivery] = useState(localInput(product.delivery_at))
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const preview = draft.photo ?? (removed ? null : productImage(product))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const problem = draftError(draft)
    if (problem) return setError(problem)
    if (!stock && !client.trim()) return setError("Klient ismini kiriting")
    setPending(true)
    const result = await safe(() =>
      updateProduct({
        id: product.id,
        type_id: Number(draft.typeId),
        name: draft.name,
        image: draft.photo,
        remove_image: removed && !draft.photo,
        price: Number(draft.price),
        quantity: draft.quantity,
        client_name: stock ? null : client,
        address,
        delivery_at: delivery,
      }),
    )
    setPending(false)
    if ("error" in result) {
      setError(result.error ?? "Xatolik yuz berdi")
      return
    }
    toast(`${draft.name.trim()} yangilandi`)
    onClose()
  }

  return (
    <Modal title="Tovarni tahrirlash" onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <ItemFields
          draft={draft}
          onChange={setDraft}
          types={types}
          preview={preview}
          onPhoto={(photo) => {
            setDraft({ ...draft, photo })
            if (!photo) setRemoved(true)
          }}
          onError={setError}
        />
        <div className="border-t border-white/10 pt-3 text-xs font-semibold uppercase tracking-[0.06em] text-white/45">
          {stock ? "Ombor" : "Buyurtma"}
        </div>
        {isAdmin ? (
          <div className="tabs" role="tablist">
            {[
              { value: false, label: "Sotuv uchun" },
              { value: true, label: "Ombor uchun" },
            ].map((item) => (
              <button
                key={item.label}
                className="tab"
                type="button"
                role="tab"
                aria-selected={stock === item.value}
                onClick={() => setStock(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
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
        {!stock && siblings > 1 ? (
          <p className="text-xs text-white/55">Klient, manzil va vaqt shu buyurtmadagi barcha {siblings} tovar uchun o&apos;zgaradi.</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button className="btn w-full" type="submit" disabled={pending}>
          {pending ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </form>
    </Modal>
  )
}
