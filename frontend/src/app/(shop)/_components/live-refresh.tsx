"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function LiveRefresh() {
  const router = useRouter()
  useEffect(() => {
    let last = Date.now()
    function refresh() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return
      last = Date.now()
      router.refresh()
    }
    function wake() {
      if (Date.now() - last > 8000) refresh()
    }
    const timer = setInterval(refresh, 10000)
    document.addEventListener("visibilitychange", wake)
    window.addEventListener("online", wake)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", wake)
      window.removeEventListener("online", wake)
    }
  }, [router])
  return null
}
