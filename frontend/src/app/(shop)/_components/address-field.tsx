"use client"

import { useEffect, useState } from "react"

import { reverseAddress } from "@/actions/shop"

import { PlaceMap } from "./place-map"

export function AddressField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [geoOff, setGeoOff] = useState(false)
  const [draft, setDraft] = useState("")

  useEffect(() => {
    if (!mapOpen || !pin) return
    let live = true
    setDraft("")
    reverseAddress(pin.lat, pin.lng)
      .then((result) => {
        if (!live) return
        const found = "address" in result ? result.address : ""
        setDraft(found || `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`)
      })
      .catch(() => {
        if (live) setDraft(`${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`)
      })
    return () => {
      live = false
    }
  }, [mapOpen, pin])

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

  return (
    <>
      <label className="block text-sm text-white/70">
        Manzil
        <span className="mt-1 flex gap-2">
          <input className="field" required value={value} onChange={(event) => onChange(event.target.value)} />
          <button className="btn-line shrink-0" type="button" onClick={locate}>
            Turgan joyim
          </button>
        </span>
      </label>

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
                onChange(draft)
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
    </>
  )
}
