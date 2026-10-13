"use client"

import { money } from "@/lib/format"
import type { ProductType } from "@/lib/types"

import { PhotoPicker } from "./photo-picker"
import { QtyStepper } from "./qty-stepper"

export type Draft = { typeId: string; name: string; price: string; quantity: number; photo: string | null; noImage: boolean }

export const EMPTY_DRAFT: Draft = { typeId: "", name: "", price: "", quantity: 1, photo: null, noImage: false }

export function draftError(draft: Draft) {
  if (!draft.typeId) return "Tovar turini tanlang"
  if (!draft.name.trim()) return "Tovar nomini kiriting"
  if (!(Number(draft.price) > 0)) return "Narxni kiriting"
  if (draft.quantity < 1) return "Sonini kiriting"
  return null
}

export function ItemFields({
  draft,
  onChange,
  types,
  preview,
  onPhoto,
  onError,
  allowNoImage,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  types: ProductType[]
  preview: string | null
  onPhoto: (dataUrl: string | null) => void
  onError: (message: string) => void
  allowNoImage?: boolean
}) {
  const price = Number(draft.price)
  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm text-white/70">
        Tovar turi
        <select className="field mt-1" value={draft.typeId} onChange={(event) => onChange({ ...draft, typeId: event.target.value })}>
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
      <label className="block text-sm text-white/70">
        Tovar nomi
        <input
          className="field mt-1"
          value={draft.name}
          maxLength={160}
          placeholder="Masalan Hoco W35"
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </label>
      <div className="text-sm text-white/70">
        <div className="mb-1 flex items-center justify-between">
          <span>Rasm</span>
          {allowNoImage ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.noImage}
                onChange={(event) => onChange({ ...draft, noImage: event.target.checked, photo: event.target.checked ? null : draft.photo })}
              />
              Rasmsiz
            </label>
          ) : null}
        </div>
        {draft.noImage ? null : <PhotoPicker preview={preview} onPhoto={onPhoto} onError={onError} />}
      </div>
      <label className="block text-sm text-white/70">
        Narx (1 dona), so&apos;m
        <input
          className="field mt-1"
          type="number"
          inputMode="numeric"
          min={1}
          value={draft.price}
          onChange={(event) => onChange({ ...draft, price: event.target.value })}
        />
      </label>
      <div className="text-sm text-white/70">
        <div className="flex items-center justify-between">
          <span>Soni</span>
          {draft.quantity > 1 && price > 0 ? (
            <span>
              Jami: <span className="font-semibold text-[#c6f135]">{money(price * draft.quantity)}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-1">
          <QtyStepper value={draft.quantity} onChange={(quantity) => onChange({ ...draft, quantity })} />
        </div>
      </div>
    </div>
  )
}
