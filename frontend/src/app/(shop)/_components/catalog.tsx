"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { createProduct, reverseAddress, sellProduct } from "@/actions/shop"
import { money, when } from "@/lib/format"
import { compress } from "@/lib/image"
import type { Product, ProductType } from "@/lib/types"

import { PlaceMap } from "./place-map"

const PAGE_SIZE = 6

export function Catalog({ products, types, isAdmin }: { products: Product[]; types: ProductType[]; isAdmin: boolean }) {
  const [typeId, setTypeId] = useState("")
  const [page, setPage] = useState(1)
  const [stock, setStock] = useState(false)
  const [model, setModel] = useState("")
  const [adding, setAdding] = useState(false)
  const [selling, setSelling] = useState<Product | null>(null)
  const [error, setError] = useState("")
  const [payment, setPayment] = useState("cash")
  const [pending, setPending] = useState(false)
  const [noImage, setNoImage] = useState(false)
  const [photo, setPhoto] = useState("")
  const [preview, setPreview] = useState("")
  const [address, setAddress] = useState("")
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [geoOff, setGeoOff] = useState(false)
  const [draft, setDraft] = useState("")
  const [cameraOn, setCameraOn] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!mapOpen || !pin) return
    let live = true
    setDraft("")
    reverseAddress(pin.lat, pin.lng).then((result) => {
      if (!live) return
      const found = "address" in result ? result.address : ""
      setDraft(found || `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`)
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

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  function resetOrder() {
    stopCamera()
    setNoImage(false)
    setStock(false)
    setPhoto("")
    setPreview("")
    setAddress("")
    setPin(null)
    setMapOpen(false)
    setGeoOff(false)
    setDraft("")
    setError("")
  }

  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!cameraOn || !video || !stream) return
    video.srcObject = stream
    void video.play()
    return () => {
      video.srcObject = null
    }
  }, [cameraOn])

  async function openCamera() {
    if (window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      const attempts: MediaStreamConstraints[] = [
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        { audio: false, video: { facingMode: "user" } },
        { audio: false, video: true },
      ]
      for (const constraints of attempts) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          streamRef.current?.getTracks().forEach((track) => track.stop())
          streamRef.current = stream
          setCameraOn(true)
          return
        } catch {
          continue
        }
      }
    }
    captureRef.current?.click()
  }

  function snap() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      takePhoto(new File([blob], "camera.jpg", { type: "image/jpeg" }))
      stopCamera()
    }, "image/jpeg", 0.9)
  }

  async function takePhoto(file: File | undefined) {
    if (!file) return
    const dataUrl = await compress(file)
    if (!dataUrl) {
      setError("Rasm formati qo'llab-quvvatlanmaydi")
      return
    }
    setError("")
    setPhoto(dataUrl)
    setPreview(dataUrl)
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
    if (!noImage && photo) formData.set("image", photo)
    const result = await createProduct(formData)
    setPending(false)
    if (result && "error" in result && result.error) {
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
            setPage(1)
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
            onChange={(event) => {
              setModel(event.target.value)
              setPage(1)
            }}
          />
        </label>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-white/55">Tovar topilmadi</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {shown.map((item) => (
            <article key={item.id} className="card flex flex-col gap-3 p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45 sm:text-[11px]">
                  {item.type_name}
                </p>
                {item.client_name ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Buyurtma
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Sotuv uchun
                  </span>
                )}
              </div>
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-black/25">
                {item.image ? (
                  <img className="h-full w-full object-contain" src={item.image} alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/25">
                    <Icon name="image" className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                  <h2 className="min-w-0 break-words text-sm font-semibold leading-snug sm:text-base">{item.name}</h2>
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
                <Info icon="palette" label="Rang" value={item.color} />
                <Info icon="user" label="Buyurtmachi" value={item.client_name ?? "Ombor"} />
                <div className="col-span-2">
                  <Info icon="pin" label="Manzil" value={shortAddress(item.address)} title={item.address} />
                </div>
              </dl>
              <div className="mt-auto grid gap-2 sm:grid-cols-2">
                <a
                  className="btn-ghost flex items-center justify-center gap-1.5 py-2 text-sm"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="map" className="h-4 w-4" />
                  Manzil
                </a>
                <button
                  className="btn flex items-center justify-center gap-1.5 py-2 text-sm"
                  type="button"
                  onClick={() => {
                    setSelling(item)
                    setError("")
                    setPayment("cash")
                  }}
                >
                  <Icon name="check" className="h-4 w-4" />
                  Sotildi
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              className={number === current ? "btn h-9 min-w-9 px-3" : "btn-line h-9 min-w-9 px-3"}
              type="button"
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          ))}
        </div>
      ) : null}

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
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => { stopCamera(); setAdding(false) }}>
          <form
            className="glass max-h-[90vh] w-full max-w-md overflow-auto p-5"
            action={onAdd}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Yangi buyurtma</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none text-white/70 hover:text-white"
                type="button"
                aria-label="Yopish"
                onClick={() => {
                  stopCamera()
                  setAdding(false)
                }}
              >
                ×
              </button>
            </div>
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
              Klient ismi
              <input className="field mt-1" name="client_name" required={!stock} disabled={stock} />
            </label>
            {isAdmin ? (
              <label className="mb-3 flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" name="stock" checked={stock} onChange={(event) => setStock(event.target.checked)} />
                Ombor uchun
              </label>
            ) : null}
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
                    stopCamera()
                    setPhoto("")
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
                  <button className="btn-line" type="button" onClick={openCamera}>
                    Kameradan
                  </button>
                  <input
                    ref={captureRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => takePhoto(event.target.files?.[0])}
                  />
                </div>
                {cameraOn ? (
                  <div className="mt-2">
                    <video ref={videoRef} className="h-48 w-full rounded-xl object-cover" autoPlay muted playsInline />
                    <button className="btn mt-2 w-full" type="button" onClick={snap}>
                      Olish
                    </button>
                  </div>
                ) : null}
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sotildi</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none text-white/70 hover:text-white"
                type="button"
                aria-label="Yopish"
                onClick={() => setSelling(null)}
              >
                ×
              </button>
            </div>
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

type IconName = "clock" | "palette" | "user" | "pin" | "map" | "check" | "image"

const ICONS: Record<IconName, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.3-4-7.7-9-7.7z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10.5" cy="7" r="1" />
      <circle cx="15" cy="7.5" r="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
