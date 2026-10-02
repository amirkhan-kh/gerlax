"use client"

import { useEffect, useRef, useState } from "react"

const ZOOM = 16
const ECC = 0.0818191908426

function world(lat: number, lng: number) {
  const beta = (lat * Math.PI) / 180
  const phi = (1 - ECC * Math.sin(beta)) / (1 + ECC * Math.sin(beta))
  const theta = Math.tan(Math.PI / 4 + beta / 2) * phi ** (ECC / 2)
  const rho = 2 ** (ZOOM + 7)
  return {
    x: (rho * (1 + lng / 180)) / 256,
    y: (rho * (1 - Math.log(theta) / Math.PI)) / 256,
  }
}

function geo(x: number, y: number) {
  const rho = 2 ** (ZOOM + 7)
  const lng = ((x * 256) / rho - 1) * 180
  const theta = Math.exp(Math.PI * (1 - (y * 256) / rho))
  let lat = 2 * Math.atan(theta) - Math.PI / 2
  for (let i = 0; i < 8; i += 1) {
    const phi = (1 - ECC * Math.sin(lat)) / (1 + ECC * Math.sin(lat))
    lat = 2 * Math.atan(theta / phi ** (ECC / 2)) - Math.PI / 2
  }
  return { lat: (lat * 180) / Math.PI, lng }
}

export function PlaceMap({
  lat,
  lng,
  onPick,
}: {
  lat: number
  lng: number
  onPick: (lat: number, lng: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 320, h: 256 })
  const center = world(lat, lng)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const tiles = []
  for (let ty = Math.floor(center.y) - 2; ty <= Math.floor(center.y) + 2; ty += 1) {
    for (let tx = Math.floor(center.x) - 2; tx <= Math.floor(center.x) + 2; tx += 1) {
      tiles.push({ tx, ty })
    }
  }

  return (
    <div
      ref={box}
      className="relative h-64 overflow-hidden rounded-xl bg-[#14120e]"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const dx = (event.clientX - rect.left - rect.width / 2) / 256
        const dy = (event.clientY - rect.top - rect.height / 2) / 256
        const next = geo(center.x + dx, center.y + dy)
        onPick(next.lat, next.lng)
      }}
    >
      {tiles.map((tile) => {
        const left = (tile.tx - center.x) * 256 + size.w / 2
        const top = (tile.ty - center.y) * 256 + size.h / 2
        const query = `x=${tile.tx}&y=${tile.ty}&z=${ZOOM}&scale=1&lang=uz_UZ`
        return (
          <span key={`${tile.tx}-${tile.ty}`} className="pointer-events-none absolute" style={{ left, top }}>
            <img
              alt=""
              draggable={false}
              width={256}
              height={256}
              className="max-w-none"
              referrerPolicy="no-referrer"
              src={`https://sat01.maps.yandex.net/tiles?l=sat&${query}`}
            />
            <img
              alt=""
              draggable={false}
              width={256}
              height={256}
              className="absolute top-0 left-0 max-w-none"
              referrerPolicy="no-referrer"
              src={`https://core-renderer-tiles.maps.yandex.net/tiles?l=skl&${query}`}
            />
          </span>
        )
      })}
      <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">
        Yandex
      </span>
      <span className="pointer-events-none absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#14120e] bg-[#c6f135]" />
    </div>
  )
}
