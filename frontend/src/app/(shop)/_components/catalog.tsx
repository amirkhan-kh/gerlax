"use client"

import { useEffect, useMemo, useState } from "react"

import { createProduct, reverseAddress, sellProduct } from "@/actions/shop"
import { money, when } from "@/lib/format"
import type { Product, ProductType } from "@/lib/types"

import { PlaceMap } from "./place-map"

export function Catalog({ products, types }: { products: Product[]; types: ProductType[] }) {
  const [typeId, setTypeId] = useState("")
  const [model, setModel] = useState("")
  const [adding, setAdding] = useState(false)
  const [selling, setSelling] = useState<Product | null>(null)
  const [error, setError] = useState("")
  const [payment, setPayment] = useState("cash")
  const [pending, setPending] = useState(false)
  const [noImage, setNoImage] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [address, setAddress] = useState("")
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [geoOff, setGeoOff] = useState(false)
  const [draft, setDraft] = useState("")

  useEffect(() => {
    if (!mapOpen || !pin) return
    let live = true
    setDraft("")
    reverseAddress(pin.lat, pin.lng).then((result) => {
      if (!live) return
      setDraft("address" in result ? result.address : `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`)
    })
    return () => {
      live = false
    }
  }, [mapOpen, pin])

  const visible = useMemo(() => {
    return products.filter((item) => {
      if (typeId && String(item.type_id) !== typeId) return false
      if (typeId && model && !item.name.toLowerCase().includes(model.trim().toLowerCase())) return false
      return true
    })
  }, [products, typeId, model])

  function resetOrder() {
    setNoImage(false)
    setPhoto(null)
    setPreview("")
    setAddress("")
    setPin(null)
    setMapOpen(false)
    setGeoOff(false)
    setDraft("")
    setError("")
  }

  function takePhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  function locate() {
    if (!navigator.geolocation) {
      setGeoOff(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoOff(false)
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setMapOpen(true)
      },
      () => setGeoOff(true),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  async function onAdd(formData: FormData) {
    if (!noImage && !photo) {
      setError("Rasm yuklang")
      return
    }
    setPending(true)
    if (!noImage && photo) formData.set("image", await compress(photo))
    const result = await createProduct(formData)
    setPending(false)
    if (result && "error" in result) {
      setError(result.error)
      return
    }
    setAdding(false)
    resetOrder()
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
              {item.image ? <img className="h-28 w-full rounded-xl object-cover" src={item.image} alt="" /> : null}
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
          resetOrder()
          setAdding(true)
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
              <span className="mt-1 flex gap-2">
                <input
                  className="field"
                  name="address"
                  required
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
                <button className="btn-line shrink-0" type="button" onClick={locate}>
                  Turgan joyim
                </button>
              </span>
            </label>
            <label className="mb-3 flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={noImage}
                onChange={(event) => {
                  setNoImage(event.target.checked)
                  if (event.target.checked) {
                    setPhoto(null)
                    setPreview("")
                  }
                }}
              />
              Rasm siz
            </label>
            {noImage ? null : (
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="btn-line relative text-center">
                    Fayldan
                    <input
                      className="absolute inset-0 cursor-pointer opacity-0"
                      type="file"
                      accept="image/*"
                      required={!photo}
                      onChange={(event) => takePhoto(event.target.files?.[0])}
                    />
                  </label>
                  <label className="btn-line relative text-center">
                    Kameradan
                    <input
                      className="absolute inset-0 cursor-pointer opacity-0"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => takePhoto(event.target.files?.[0])}
                    />
                  </label>
                </div>
                {preview ? <img className="mt-2 h-32 w-full rounded-xl object-cover" src={preview} alt="" /> : null}
              </div>
            )}
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

      {mapOpen && pin ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setMapOpen(false)}>
          <div className="glass w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-3 text-xl font-semibold">Xaritada belgilang</h2>
            <PlaceMap lat={pin.lat} lng={pin.lng} onPick={(lat, lng) => setPin({ lat, lng })} />
            <p className="mt-3 text-sm text-white/70">{draft || "Manzil aniqlanmoqda"}</p>
            <button
              className="btn mt-4 w-full"
              type="button"
              disabled={!draft}
              onClick={() => {
                setAddress(draft)
                setMapOpen(false)
              }}
            >
              Belgilash
            </button>
          </div>
        </div>
      ) : null}

      {geoOff ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setGeoOff(false)}>
          <div className="glass w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-xl font-semibold">Joylashuv o&apos;chiq</h2>
            <p className="mt-2 text-sm text-white/70">Telefon sozlamalarida joylashuvni yoqing va ruxsat bering.</p>
            <button className="btn mt-4 w-full" type="button" onClick={locate}>
              Yoqish
            </button>
          </div>
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

async function compress(file: File) {
  const bitmap = await createImageBitmap(file)
  const max = 1024
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", 0.7)
}
