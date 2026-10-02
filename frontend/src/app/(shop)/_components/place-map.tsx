"use client"

import { useEffect, useRef, useState } from "react"

const ZOOM = 16

function world(lat: number, lng: number) {
  const n = 2 ** ZOOM
  const x = ((lng + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
}

function geo(x: number, y: number) {
  const n = 2 ** ZOOM
  const lng = (x / n) * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI
  return { lat, lng }
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
      className="relative h-64 overflow-hidden rounded-xl"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const dx = (event.clientX - rect.left - rect.width / 2) / 256
        const dy = (event.clientY - rect.top - rect.height / 2) / 256
        const next = geo(center.x + dx, center.y + dy)
        onPick(next.lat, next.lng)
      }}
    >
      {tiles.map((tile) => (
        <img
          key={`${tile.tx}-${tile.ty}`}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          width={256}
          height={256}
          src={`https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x=${tile.tx}&y=${tile.ty}&z=${ZOOM}&scale=1&lang=uz_UZ`}
          style={{
            left: (tile.tx - center.x) * 256 + size.w / 2,
            top: (tile.ty - center.y) * 256 + size.h / 2,
          }}
        />
      ))}
      <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">
        Yandex
      </span>
      <span className="pointer-events-none absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#14120e] bg-[#c6f135]" />
    </div>
  )
}
