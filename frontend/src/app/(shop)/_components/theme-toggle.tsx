"use client"

import { useSyncExternalStore } from "react"

function theme() {
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, theme, () => "dark")

  function toggle() {
    const next = mode === "dark" ? "light" : "dark"
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.classList.add(next)
    localStorage.setItem("gerlax-theme", next)
  }

  return (
    <button className="rounded-full border border-white/15 px-3 py-1" type="button" onClick={toggle}>
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  )
}
