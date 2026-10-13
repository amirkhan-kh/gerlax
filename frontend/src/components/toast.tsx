"use client"

import { useSyncExternalStore } from "react"

import { Icon } from "./icon"

type Toast = { id: number; text: string; kind: "ok" | "error" }

const EMPTY: Toast[] = []
const listeners = new Set<() => void>()
let items: Toast[] = EMPTY
let seq = 0

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function toast(text: string, kind: Toast["kind"] = "ok") {
  const id = ++seq
  items = [...items.slice(-2), { id, text, kind }]
  emit()
  setTimeout(() => {
    items = items.filter((item) => item.id !== id)
    emit()
  }, 3500)
}

export async function safe<T>(call: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await call()
  } catch (error) {
    if (error instanceof Error && /server action/i.test(error.message)) window.location.reload()
    return { error: "Server bilan aloqa uzildi. Qayta urinib ko'ring" }
  }
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 pr-24 pl-3 sm:px-3" aria-live="polite">
      {list.map((item) => (
        <div key={item.id} className="glass toast flex max-w-sm items-center gap-2.5 px-4 py-3 text-sm font-medium">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              item.kind === "ok" ? "bg-[#c6f135] text-[#14120e]" : "bg-red-500/15 text-red-400"
            }`}
          >
            <Icon name={item.kind === "ok" ? "check" : "ban"} className="h-3.5 w-3.5" />
          </span>
          {item.text}
        </div>
      ))}
    </div>
  )
}
