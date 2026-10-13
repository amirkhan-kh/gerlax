"use client"

import { useEffect } from "react"

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    const timer = setTimeout(retry, 4000)
    return () => clearTimeout(timer)
  }, [retry])

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-lg font-semibold">Sahifa yuklanmadi</p>
      <p className="mt-1 text-sm text-white/55">Internet yoki server bilan aloqa uzildi. Avtomatik qayta urinilmoqda.</p>
      <button className="btn mt-5 px-6" type="button" onClick={retry}>
        Qayta urinish
      </button>
    </div>
  )
}
