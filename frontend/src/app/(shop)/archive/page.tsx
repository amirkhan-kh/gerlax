import { api, rethrow } from "@/lib/api"
import type { ArchivedProduct } from "@/lib/types"

import { ArchiveList } from "./_components/archive-list"

export const dynamic = "force-dynamic"

export default async function ArchivePage() {
  let items: ArchivedProduct[]
  try {
    items = await api<ArchivedProduct[]>("/api/v1/products/archive")
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Arxiv</h1>
        <p className="text-sm text-white/55">Sotilgan, to&apos;liq bekor qilingan va nuqsonli (brak) tovarlar</p>
      </div>
      <ArchiveList items={items} />
    </section>
  )
}
